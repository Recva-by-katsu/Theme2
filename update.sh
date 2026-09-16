#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/scripts/common.sh"

PACKAGE_THEME_VERSION="$THEME_VERSION"

PANEL_DIR=""
FORCE=0
ROLLBACK=0
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
        --rollback)
            ROLLBACK=1
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

PANEL_DIR="$(resolve_panel_dir "$PANEL_DIR")"
log_info "Using panel directory: $PANEL_DIR"

if [[ "$ROLLBACK" -eq 1 ]]; then
    if read_install_state "$PANEL_DIR"; then
        rollback_backup="${ORIGINAL_BACKUP_DIR:-${BACKUP_DIR:-}}"
    else
        rollback_backup=""
    fi

    if [[ -n "$rollback_backup" ]]; then
        log_warn "Rolling back using backup: $rollback_backup"
        uninstall_args=(--panel-dir "$PANEL_DIR" --backup-dir "$rollback_backup")
        if [[ "$SKIP_BUILD" -eq 1 ]]; then
            uninstall_args+=(--skip-build)
        fi

        bash "$SCRIPT_DIR/uninstall.sh" "${uninstall_args[@]}"
        exit $?
    fi

    fail "No installation state with backup path found for rollback."
fi

if read_install_state "$PANEL_DIR"; then
    log_info "Detected installed Orbit Theme version: ${THEME_VERSION:-unknown}"
fi

log_info "Applying update package v$PACKAGE_THEME_VERSION"
install_args=(--panel-dir "$PANEL_DIR")
if [[ "$FORCE" -eq 1 ]]; then
    install_args+=(--force)
fi
if [[ "$SKIP_BUILD" -eq 1 ]]; then
    install_args+=(--skip-build)
fi

bash "$SCRIPT_DIR/install.sh" "${install_args[@]}"
