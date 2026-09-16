#!/usr/bin/env bash

set -Eeuo pipefail

REPO_SLUG="${THEME_REPO_SLUG:-Recva-by-katsu/Theme2}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bootstrap_if_needed() {
    if [[ -f "$SCRIPT_DIR/version" && -f "$SCRIPT_DIR/scripts/common.sh" ]]; then
        return
    fi

    local tmp_dir
    tmp_dir="$(mktemp -d)"
    local archive_url="https://github.com/${REPO_SLUG}/archive/refs/heads/main.tar.gz"

    echo "[INFO] Bootstrapping theme package from $archive_url"
    curl -fsSL "$archive_url" | tar -xz -C "$tmp_dir"

    local extracted
    extracted="$(find "$tmp_dir" -mindepth 1 -maxdepth 1 -type d | head -n1)"
    [[ -n "$extracted" ]] || {
        echo "[ERROR] Unable to bootstrap theme package." >&2
        exit 1
    }

    ORBIT_THEME_ROOT="$extracted" bash "$extracted/install.sh" "$@"
    local status=$?
    rm -rf "$tmp_dir"
    exit "$status"
}

bootstrap_if_needed "$@"

# shellcheck disable=SC1091
source "$SCRIPT_DIR/scripts/common.sh"

PANEL_DIR=""
FORCE=0
SKIP_BUILD=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --panel-dir)
            PANEL_DIR="$2"
            shift 2
            ;;
        --force)
            FORCE=1
            shift
            ;;
        --skip-build)
            SKIP_BUILD=1
            shift
            ;;
        *)
            fail "Unknown argument: $1"
            ;;
    esac
done

require_root
require_command git
require_command curl

OS_NAME="$(detect_os)"
log_info "Detected OS: $OS_NAME"

PANEL_DIR="$(resolve_panel_dir "$PANEL_DIR")"
log_info "Using panel directory: $PANEL_DIR"
verify_compatibility "$PANEL_DIR" "$FORCE"

PATCH_STATUS="$(patch_state "$PANEL_DIR")"
BACKUP_DIR=""
MAINTENANCE_ENTERED=0

rollback_on_error() {
    log_error "Installation failed. Attempting rollback..."

    if [[ -n "$BACKUP_DIR" && -d "$BACKUP_DIR/files" ]]; then
        restore_backup_files "$PANEL_DIR" "$BACKUP_DIR" || true
        log_warn "Backup files were restored from $BACKUP_DIR"
    fi

    if [[ "$MAINTENANCE_ENTERED" -eq 1 ]]; then
        leave_maintenance "$PANEL_DIR"
    fi
}
trap rollback_on_error ERR

BACKUP_DIR="$(create_backup "$PANEL_DIR")"
log_ok "Backup created: $BACKUP_DIR"

enter_maintenance "$PANEL_DIR"
MAINTENANCE_ENTERED=1

if [[ "$PATCH_STATUS" == "clean" ]]; then
    log_info "Applying Orbit theme patch..."
    apply_patch "$PANEL_DIR"
    log_ok "Patch applied successfully."
elif [[ "$PATCH_STATUS" == "applied" ]]; then
    log_warn "Patch already applied; continuing with rebuild/cache refresh."
else
    [[ "$FORCE" -eq 1 ]] || fail "Patch state is unknown. Use --force only if you know this panel tree is compatible."
    log_warn "Attempting patch apply due to --force."
    apply_patch "$PANEL_DIR"
fi

log_info "Syncing overlay files..."
sync_overlay "$PANEL_DIR"
log_ok "Overlay files copied."

run_migrations "$PANEL_DIR"
log_ok "Database migrations completed."

if [[ "$SKIP_BUILD" -eq 1 ]]; then
    log_warn "Skipping frontend build (--skip-build)."
else
    log_info "Building frontend assets..."
    build_frontend "$PANEL_DIR"
    log_ok "Frontend build completed."
fi

clear_caches "$PANEL_DIR"
fix_permissions "$PANEL_DIR"
record_install_state "$PANEL_DIR" "$BACKUP_DIR"

leave_maintenance "$PANEL_DIR"
MAINTENANCE_ENTERED=0
trap - ERR

log_ok "Orbit Theme v$THEME_VERSION installed successfully for Pterodactyl Panel $SUPPORTED_VERSION."
log_info "Theme Settings location: Admin → Settings → Theme"
log_info "Rollback: bash uninstall.sh --panel-dir $PANEL_DIR"
