#!/usr/bin/env bash
#
# Aurora Theme for Pterodactyl Panel — updater (with rollback support).
#
# Usage:
#   bash update.sh [--panel-dir PATH] [--ref main] [--force] [--skip-build]
#                  [--no-deps] [--yes]
#   bash update.sh --rollback [--panel-dir PATH] [--backup DIR] [--yes]
#
# Updates by downloading the requested ref from GitHub (or using --local to use
# the current checkout), then running the installer from that package.
#
set -euo pipefail

SELF_DIR=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
if [ -n "$SELF_DIR" ] && [ -f "$SELF_DIR/scripts/lib.sh" ]; then
    AURORA_SOURCE_DIR="$SELF_DIR"
elif [ -f "$(pwd)/scripts/lib.sh" ] && [ -f "$(pwd)/version" ]; then
    AURORA_SOURCE_DIR="$(pwd)"
else
    echo "[ERROR] update.sh must be run from the Aurora Theme repository (git clone it first)."
    exit 1
fi

# shellcheck disable=SC1091
. "$AURORA_SOURCE_DIR/scripts/lib.sh"
# shellcheck disable=SC1091
. "$AURORA_SOURCE_DIR/scripts/manifest.sh"

AURORA_REPO="${AURORA_REPO:-Recva-by-katsu/Theme2}"
AURORA_REF="${AURORA_REF:-main}"

PANEL_DIR="${PANEL_DIR:-}"
DO_ROLLBACK=""
ROLLBACK_BACKUP=""
USE_LOCAL=""
AURORA_FORCE="${AURORA_FORCE:-}"
SKIP_BUILD="${AURORA_SKIP_BUILD:-}"
AURORA_DEPS_MODE="${AURORA_DEPS_MODE:-auto}"
ASSUME_YES=""
AURORA_VERBOSE="${AURORA_VERBOSE:-}"

while [ $# -gt 0 ]; do
    case "$1" in
        --panel-dir) PANEL_DIR="${2:-}"; shift 2 ;;
        --panel-dir=*) PANEL_DIR="${1#--panel-dir=}"; shift ;;
        --ref) AURORA_REF="${2:-}"; shift 2 ;;
        --ref=*) AURORA_REF="${1#--ref=}"; shift ;;
        --rollback) DO_ROLLBACK=1; shift ;;
        --backup) ROLLBACK_BACKUP="${2:-}"; shift 2 ;;
        --backup=*) ROLLBACK_BACKUP="${1#--backup=}"; shift ;;
        --local) USE_LOCAL=1; shift ;;
        --force|-f) AURORA_FORCE=1; shift ;;
        --skip-build) SKIP_BUILD=1; shift ;;
        --no-deps) AURORA_DEPS_MODE=off; shift ;;
        --yes|-y) ASSUME_YES=1; shift ;;
        --verbose|-v) AURORA_VERBOSE=1; shift ;;
        --help|-h)
            sed -n '2,20p' "$AURORA_SOURCE_DIR/update.sh"
            echo ""
            echo "Options:"
            echo "  --ref REF          Branch/tag to update to (default: main)"
            echo "  --rollback         Restore the newest (or --backup) backup"
            echo "  --local            Update from this checkout instead of downloading"
            echo "  --force            Bypass version/support checks"
            echo "  --skip-build       Skip the frontend build"
            echo "  --no-deps          Do NOT auto-install missing system dependencies"
            echo "  --yes              Assume yes for prompts"
            echo "  --verbose          Show full command output"
            exit 0
            ;;
        *) echo "[ERROR] Unknown option: $1 (see --help)"; exit 1 ;;
    esac
done

export AURORA_FORCE AURORA_VERBOSE AURORA_DEPS_MODE

# ---------------------------------------------------------------------------
# Rollback mode: restore newest (or chosen) backup, rebuild, verify.
# ---------------------------------------------------------------------------
if [ -n "$DO_ROLLBACK" ]; then
    echo ""
    aurora_step "Aurora Theme — rollback"
    echo ""
    aurora_require_root
    PANEL_DIR_RESOLVED="$(aurora_detect_panel_dir "$PANEL_DIR")"
    export PANEL_DIR_RESOLVED
    aurora_assert_panel_dir "$PANEL_DIR_RESOLVED"

    if [ -n "$ROLLBACK_BACKUP" ]; then
        BACKUP_DIR="$ROLLBACK_BACKUP"
        [ -f "$BACKUP_DIR/MANIFEST.tsv" ] || { aurora_error "Backup '$BACKUP_DIR' has no MANIFEST.tsv."; exit 1; }
    else
        BACKUP_DIR="$(aurora_latest_backup)" || { aurora_error "No Aurora backup found under $(aurora_backup_root)."; exit 1; }
    fi
    aurora_info "Rolling back using: $BACKUP_DIR"

    if [ -z "$ASSUME_YES" ]; then
        printf 'Restore panel files from this backup and rebuild? [y/N] '
        read -r answer
        case "$answer" in
            y|Y|yes|YES) ;;
            *) aurora_info "Aborted by user."; exit 0 ;;
        esac
    fi

    MAINTENANCE_ACTIVE=0
    trap 'code=$?; aurora_error "Rollback failed (exit $code)."; [ "$MAINTENANCE_ACTIVE" = "1" ] && aurora_artisan "$PANEL_DIR_RESOLVED" up >/dev/null 2>&1; exit $code' ERR

    aurora_run "enable maintenance mode" aurora_artisan "$PANEL_DIR_RESOLVED" down
    MAINTENANCE_ACTIVE=1

    RESTORED=0
    while IFS=$'\t' read -r kind rel; do
        [ -z "$kind" ] && continue
        [ "$kind" = "database" ] && continue
        if [ -e "$BACKUP_DIR/files/$rel" ]; then
            if [ -d "$BACKUP_DIR/files/$rel" ] && [ ! -L "$BACKUP_DIR/files/$rel" ]; then
                mkdir -p "$PANEL_DIR_RESOLVED/$rel"
                cp -a "$BACKUP_DIR/files/$rel/." "$PANEL_DIR_RESOLVED/$rel/"
            else
                mkdir -p "$(dirname "$PANEL_DIR_RESOLVED/$rel")"
                cp -a "$BACKUP_DIR/files/$rel" "$PANEL_DIR_RESOLVED/$rel"
            fi
            RESTORED=$((RESTORED + 1))
        fi
    done < "$BACKUP_DIR/MANIFEST.tsv"
    aurora_ok "Restored $RESTORED path(s)."

    # If the backup predates the theme, remove theme-created files too.
    if [ -f "$BACKUP_DIR/META.env" ]; then
        # shellcheck disable=SC1090
        . "$BACKUP_DIR/META.env"
        if [ "${action:-}" = "install" ]; then
            aurora_info "Backup predates the theme — removing theme-created files..."
            for entry in "${AURORA_NEW_PATHS[@]}"; do
                aurora_remove_if_exists "$PANEL_DIR_RESOLVED/${entry%:tree}"
            done
        fi
    fi

    aurora_artisan "$PANEL_DIR_RESOLVED" migrate --force >/dev/null 2>&1 || true
    if [ -z "$SKIP_BUILD" ]; then
        if command -v yarn >/dev/null 2>&1; then
            aurora_run "yarn build:production" bash -c "cd \"$PANEL_DIR_RESOLVED\" && yarn build:production"
        elif command -v npm >/dev/null 2>&1; then
            aurora_run "rebuild" bash -c "cd \"$PANEL_DIR_RESOLVED\" && npx cross-env NODE_ENV=production webpack --mode production"
        fi
    fi
    aurora_clear_caches "$PANEL_DIR_RESOLVED"
    WEB_USER="$(aurora_detect_web_user)"
    aurora_fix_permissions "$PANEL_DIR_RESOLVED" "$WEB_USER" "$(aurora_detect_web_group "$WEB_USER")"
    aurora_run "disable maintenance mode" aurora_artisan "$PANEL_DIR_RESOLVED" up
    MAINTENANCE_ACTIVE=0
    trap - ERR

    echo ""
    aurora_ok "Rollback complete."
    echo ""
    exit 0
fi

# ---------------------------------------------------------------------------
# Update mode
# ---------------------------------------------------------------------------
echo ""
aurora_step "Aurora Theme — updater"
echo ""

aurora_require_root
PANEL_DIR_RESOLVED="$(aurora_detect_panel_dir "$PANEL_DIR")"
export PANEL_DIR_RESOLVED
aurora_assert_panel_dir "$PANEL_DIR_RESOLVED"
aurora_info "Panel directory: $PANEL_DIR_RESOLVED"
aurora_info "Panel version: $(aurora_detect_panel_version "$PANEL_DIR_RESOLVED")"

INSTALLED_VERSION="$(aurora_installed_version "$PANEL_DIR_RESOLVED")"
if [ "$INSTALLED_VERSION" = "none" ]; then
    aurora_error "Aurora Theme does not appear to be installed (no version record)."
    aurora_error "Run install.sh instead, or re-run with --force to install fresh."
    [ -z "$AURORA_FORCE" ] && exit 1
else
    aurora_info "Installed theme version: $INSTALLED_VERSION"
fi

PACKAGE_DIR="$AURORA_SOURCE_DIR"
if [ -z "$USE_LOCAL" ]; then
    aurora_step "Downloading Aurora Theme (${AURORA_REPO}@${AURORA_REF})..."
    _tmp="$(mktemp -d)"
    _tarball="$_tmp/aurora.tar.gz"
    _url="https://github.com/${AURORA_REPO}/archive/refs/heads/${AURORA_REF}.tar.gz"
    if [[ "$AURORA_REF" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        _tag="$AURORA_REF"
        [[ "$_tag" == v* ]] || _tag="v$_tag"
        _url="https://github.com/${AURORA_REPO}/archive/refs/tags/${_tag}.tar.gz"
    fi
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$_url" -o "$_tarball" || { aurora_error "Download failed: $_url"; exit 1; }
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$_tarball" "$_url" || { aurora_error "Download failed: $_url"; exit 1; }
    else
        aurora_error "Neither curl nor wget is available."
        exit 1
    fi
    tar -xzf "$_tarball" -C "$_tmp" || { aurora_error "Failed to extract theme package."; exit 1; }
    PACKAGE_DIR="$(find "$_tmp" -maxdepth 1 -name '*-*' -type d | head -n 1)"
    [ -f "$PACKAGE_DIR/install.sh" ] || { aurora_error "Downloaded package is invalid."; exit 1; }
    aurora_ok "Package ready: $PACKAGE_DIR"
else
    aurora_info "Using local package: $PACKAGE_DIR"
fi

NEW_VERSION="$(tr -d '[:space:]' < "$PACKAGE_DIR/version")"
aurora_info "Target theme version: $NEW_VERSION"

if [ "$INSTALLED_VERSION" != "none" ]; then
    set +e
    aurora_vercmp "$INSTALLED_VERSION" "$NEW_VERSION"
    cmp=$?
    set -e
    if [ "$cmp" -eq 0 ]; then
        aurora_warn "Already on version $NEW_VERSION."
        if [ -z "$ASSUME_YES" ]; then
            printf 'Re-apply anyway? [y/N] '
            read -r answer
            case "$answer" in
                y|Y|yes|YES) ;;
                *) aurora_info "Nothing to do."; exit 0 ;;
            esac
        fi
    elif [ "$cmp" -eq 2 ]; then
        aurora_warn "Installed version ($INSTALLED_VERSION) is NEWER than target ($NEW_VERSION) — this is a downgrade."
        if [ -z "$ASSUME_YES" ] && [ -z "$AURORA_FORCE" ]; then
            printf 'Continue with downgrade? [y/N] '
            read -r answer
            case "$answer" in
                y|Y|yes|YES) ;;
                *) aurora_info "Aborted by user."; exit 0 ;;
            esac
        fi
    else
        aurora_info "Upgrading $INSTALLED_VERSION -> $NEW_VERSION"
    fi
fi

# Delegate to the (new) installer's idempotent apply logic.
EXTRA_ARGS=(--panel-dir "$PANEL_DIR_RESOLVED")
[ -n "$AURORA_FORCE" ] && EXTRA_ARGS+=(--force)
[ -n "$SKIP_BUILD" ] && EXTRA_ARGS+=(--skip-build)
[ "$AURORA_DEPS_MODE" = "off" ] && EXTRA_ARGS+=(--no-deps)
[ -n "$ASSUME_YES" ] && EXTRA_ARGS+=(--yes)
[ -n "$AURORA_VERBOSE" ] && EXTRA_ARGS+=(--verbose)

export PANEL_DIR="$PANEL_DIR_RESOLVED"
exec bash "$PACKAGE_DIR/install.sh" "${EXTRA_ARGS[@]}"
