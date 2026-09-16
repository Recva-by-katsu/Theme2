#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/scripts/common.sh"

PANEL_DIR=""
RESTORE_BACKUP=""
SKIP_BUILD=0
FORCE=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --panel-dir)
            PANEL_DIR="$2"
            shift 2
            ;;
        --backup-dir)
            RESTORE_BACKUP="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=1
            shift
            ;;
        --force)
            FORCE=1
            shift
            ;;
        *)
            fail "Unknown argument: $1"
            ;;
    esac
done

require_root
require_command git

PANEL_DIR="$(resolve_panel_dir "$PANEL_DIR")"
log_info "Using panel directory: $PANEL_DIR"

if [[ -z "$RESTORE_BACKUP" ]] && read_install_state "$PANEL_DIR"; then
    log_info "Found install state for version ${THEME_VERSION:-unknown}."
fi

MAINTENANCE_ENTERED=0

cleanup_on_error() {
    log_error "Uninstall failed. Panel remains in maintenance mode for safety review."
}
trap cleanup_on_error ERR

CURRENT_BACKUP="$(create_backup "$PANEL_DIR")"
log_ok "Safety backup created: $CURRENT_BACKUP"

enter_maintenance "$PANEL_DIR"
MAINTENANCE_ENTERED=1

STATUS="$(patch_state "$PANEL_DIR")"
if [[ "$STATUS" == "applied" ]]; then
    log_info "Reversing Orbit theme patch..."
    reverse_patch "$PANEL_DIR"
    log_ok "Theme patch reversed."
elif [[ "$STATUS" == "clean" ]]; then
    log_warn "Theme patch does not appear active on this panel."
else
    [[ "$FORCE" -eq 1 ]] || fail "Unable to determine patch state. Use --force only if a backup restore is available."
    log_warn "Unknown patch state. Continuing due to --force."
fi

remove_overlay_files "$PANEL_DIR"

if [[ -n "$RESTORE_BACKUP" ]]; then
    log_info "Restoring files from backup: $RESTORE_BACKUP"
    restore_backup_files "$PANEL_DIR" "$RESTORE_BACKUP"
    log_ok "Backup files restored."
fi

run_migrations "$PANEL_DIR"

if [[ "$SKIP_BUILD" -eq 1 ]]; then
    log_warn "Skipping frontend build (--skip-build)."
else
    log_info "Rebuilding frontend assets..."
    build_frontend "$PANEL_DIR"
    log_ok "Frontend build completed."
fi

clear_caches "$PANEL_DIR"
fix_permissions "$PANEL_DIR"
rm -rf "$PANEL_DIR/.orbit-theme"

leave_maintenance "$PANEL_DIR"
MAINTENANCE_ENTERED=0
trap - ERR

log_ok "Orbit Theme v$THEME_VERSION has been removed."
log_info "If needed, restore your pre-uninstall state from: $CURRENT_BACKUP"
