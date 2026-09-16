#!/usr/bin/env bash

set -Eeuo pipefail

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THEME_ROOT="${ORBIT_THEME_ROOT:-$(cd "$COMMON_DIR/.." && pwd)}"
THEME_VERSION="$(tr -d '[:space:]' < "$THEME_ROOT/version")"
PATCH_FILE="$THEME_ROOT/patches/pterodactyl-v1.15.1-orbit-theme.patch"
MANIFEST_FILE="$THEME_ROOT/config/manifest-files.txt"
OVERLAY_MANIFEST_FILE="$THEME_ROOT/config/overlay-files.txt"
OVERLAY_DIR="$THEME_ROOT/overlay"
SUPPORTED_VERSION="1.15.1"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/pterodactyl-theme}"

COLOR_INFO='\033[1;34m'
COLOR_OK='\033[1;32m'
COLOR_WARN='\033[1;33m'
COLOR_ERROR='\033[1;31m'
COLOR_RESET='\033[0m'

log_info() { echo -e "${COLOR_INFO}[INFO]${COLOR_RESET} $*"; }
log_ok() { echo -e "${COLOR_OK}[OK]${COLOR_RESET} $*"; }
log_warn() { echo -e "${COLOR_WARN}[WARN]${COLOR_RESET} $*"; }
log_error() { echo -e "${COLOR_ERROR}[ERROR]${COLOR_RESET} $*" >&2; }

fail() {
    log_error "$*"
    exit 1
}

require_root() {
    [[ "${EUID}" -eq 0 ]] || fail "Run this script as root or with sudo."
}

require_command() {
    local cmd="$1"
    command -v "$cmd" >/dev/null 2>&1 || fail "Missing required command: $cmd"
}

detect_os() {
    local os_name="unknown"

    if [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        source /etc/os-release
        os_name="${PRETTY_NAME:-${NAME:-unknown}}"
    fi

    echo "$os_name"
}

resolve_panel_dir() {
    local arg_path="${1:-}"
    local detected=""

    if [[ -n "$arg_path" ]]; then
        detected="$arg_path"
    elif [[ -n "${PTERODACTYL_DIR:-}" ]]; then
        detected="$PTERODACTYL_DIR"
    else
        for candidate in /var/www/pterodactyl /var/www/panel /opt/pterodactyl; do
            if [[ -f "$candidate/artisan" && -f "$candidate/config/app.php" ]]; then
                detected="$candidate"
                break
            fi
        done
    fi

    [[ -n "$detected" ]] || fail "Could not detect Pterodactyl directory. Pass --panel-dir /path/to/pterodactyl."
    [[ -f "$detected/artisan" ]] || fail "Invalid panel directory: $detected (artisan not found)."
    [[ -d "$detected/resources/scripts" ]] || fail "Invalid panel directory: $detected (frontend source not found)."

    echo "$(cd "$detected" && pwd)"
}

panel_version() {
    local panel_dir="$1"
    local version=""

    if command -v php >/dev/null 2>&1; then
        version="$(php "$panel_dir/artisan" p:info --no-ansi 2>/dev/null | awk -F'|' '/Panel Version/ {gsub(/^[ \t]+|[ \t]+$/, "", $3); print $3; exit}')"
    fi

    if [[ -z "$version" ]]; then
        version="$(grep -Po "'version'\s*=>\s*'\K[^']+" "$panel_dir/config/app.php" | head -n1 || true)"
    fi

    echo "$version"
}

patch_state() {
    local panel_dir="$1"

    if git apply --unsafe-paths --directory "$panel_dir" --check "$PATCH_FILE" >/dev/null 2>&1; then
        echo "clean"
        return
    fi

    if git apply --unsafe-paths --directory "$panel_dir" --reverse --check "$PATCH_FILE" >/dev/null 2>&1; then
        echo "applied"
        return
    fi

    echo "unknown"
}

verify_compatibility() {
    local panel_dir="$1"
    local force="${2:-0}"

    [[ -f "$PATCH_FILE" ]] || fail "Patch file is missing at $PATCH_FILE"
    [[ -f "$MANIFEST_FILE" ]] || fail "Manifest file is missing at $MANIFEST_FILE"
    [[ -f "$OVERLAY_MANIFEST_FILE" ]] || fail "Overlay manifest file is missing at $OVERLAY_MANIFEST_FILE"

    local version
    version="$(panel_version "$panel_dir")"
    if [[ -n "$version" ]]; then
        log_info "Detected panel version: $version"
    else
        log_warn "Could not read panel version from artisan/config."
    fi

    if [[ "$version" != "$SUPPORTED_VERSION" && "$version" != "v$SUPPORTED_VERSION" ]]; then
        if [[ "$force" -eq 1 ]]; then
            log_warn "Proceeding with --force although expected version is $SUPPORTED_VERSION."
        else
            log_warn "Expected version $SUPPORTED_VERSION, detected '$version'. Running patch compatibility check..."
        fi
    fi

    local status
    status="$(patch_state "$panel_dir")"
    case "$status" in
        clean)
            log_ok "Patch compatibility check passed."
            ;;
        applied)
            log_warn "Theme patch already appears to be installed."
            ;;
        unknown)
            if [[ "$force" -eq 1 ]]; then
                log_warn "Patch check failed, but continuing due to --force."
            else
                fail "Patch check failed. The panel source is not compatible with this release."
            fi
            ;;
    esac
}

managed_files() {
    cat "$MANIFEST_FILE" "$OVERLAY_MANIFEST_FILE" | sed '/^[[:space:]]*$/d' | sort -u
}

enter_maintenance() {
    local panel_dir="$1"
    if command -v php >/dev/null 2>&1; then
        php "$panel_dir/artisan" down >/dev/null 2>&1 || log_warn "Could not enable maintenance mode."
    fi
}

leave_maintenance() {
    local panel_dir="$1"
    if command -v php >/dev/null 2>&1; then
        php "$panel_dir/artisan" up >/dev/null 2>&1 || log_warn "Could not disable maintenance mode automatically."
    fi
}

create_backup() {
    local panel_dir="$1"
    local timestamp
    timestamp="$(date +%Y%m%d-%H%M%S)-$RANDOM"
    local backup_dir="$BACKUP_ROOT/$timestamp"

    mkdir -p "$backup_dir/files"

    while IFS= read -r path; do
        [[ -n "$path" ]] || continue
        if [[ -e "$panel_dir/$path" ]]; then
            mkdir -p "$backup_dir/files/$(dirname "$path")"
            cp -a "$panel_dir/$path" "$backup_dir/files/$path"
        fi
    done < <(managed_files)

    cp "$MANIFEST_FILE" "$backup_dir/manifest-files.txt"
    cp "$OVERLAY_MANIFEST_FILE" "$backup_dir/overlay-files.txt"
    cp "$PATCH_FILE" "$backup_dir/theme.patch"

    if [[ -f "$panel_dir/.env" ]]; then
        cp -a "$panel_dir/.env" "$backup_dir/.env.backup"
    fi

    echo "$backup_dir"
}

record_install_state() {
    local panel_dir="$1"
    local backup_dir="$2"
    local original_backup_dir="$backup_dir"

    if [[ -f "$panel_dir/.orbit-theme/state.env" ]]; then
        # shellcheck disable=SC1090
        source "$panel_dir/.orbit-theme/state.env" || true
        if [[ -n "${ORIGINAL_BACKUP_DIR:-}" ]]; then
            original_backup_dir="$ORIGINAL_BACKUP_DIR"
        fi
    fi

    mkdir -p "$panel_dir/.orbit-theme"
    cat > "$panel_dir/.orbit-theme/state.env" <<EOF
THEME_VERSION=$THEME_VERSION
INSTALLED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
BACKUP_DIR=$backup_dir
ORIGINAL_BACKUP_DIR=$original_backup_dir
PATCH_FILE=patches/pterodactyl-v1.15.1-orbit-theme.patch
EOF
}

read_install_state() {
    local panel_dir="$1"
    local state_file="$panel_dir/.orbit-theme/state.env"

    [[ -f "$state_file" ]] || return 1

    # shellcheck disable=SC1090
    source "$state_file"
}

apply_patch() {
    local panel_dir="$1"

    git apply --unsafe-paths --directory "$panel_dir" "$PATCH_FILE"
}

sync_overlay() {
    local panel_dir="$1"

    [[ -d "$OVERLAY_DIR" ]] || fail "Overlay directory not found: $OVERLAY_DIR"
    cp -a "$OVERLAY_DIR/." "$panel_dir/"
}

reverse_patch() {
    local panel_dir="$1"

    git apply --unsafe-paths --directory "$panel_dir" --reverse "$PATCH_FILE"
}

remove_overlay_files() {
    local panel_dir="$1"

    while IFS= read -r path; do
        [[ -n "$path" ]] || continue
        rm -f "$panel_dir/$path"
    done < "$OVERLAY_MANIFEST_FILE"
}

restore_backup_files() {
    local panel_dir="$1"
    local backup_dir="$2"

    [[ -d "$backup_dir/files" ]] || fail "Backup files not found in: $backup_dir"

    cp -a "$backup_dir/files/." "$panel_dir/"
}

build_frontend() {
    local panel_dir="$1"

    if [[ -f "$panel_dir/yarn.lock" ]]; then
        require_command yarn
        (cd "$panel_dir" && yarn install --non-interactive && yarn build:production)
        return
    fi

    if [[ -f "$panel_dir/pnpm-lock.yaml" ]]; then
        require_command pnpm
        (cd "$panel_dir" && pnpm install --frozen-lockfile && pnpm run build:production)
        return
    fi

    require_command npm
    (cd "$panel_dir" && npm ci && npm run build:production)
}

run_migrations() {
    local panel_dir="$1"

    if command -v php >/dev/null 2>&1; then
        php "$panel_dir/artisan" migrate --force
    else
        log_warn "PHP not available, skipping migrations."
    fi
}

clear_caches() {
    local panel_dir="$1"

    if command -v php >/dev/null 2>&1; then
        php "$panel_dir/artisan" optimize:clear >/dev/null
    fi
}

fix_permissions() {
    local panel_dir="$1"
    local owner_group
    owner_group="$(stat -c '%u:%g' "$panel_dir")"

    while IFS= read -r path; do
        [[ -n "$path" ]] || continue
        if [[ -e "$panel_dir/$path" ]]; then
            chown "$owner_group" "$panel_dir/$path" || true
        fi
    done < <(managed_files)
}
