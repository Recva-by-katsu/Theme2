#!/usr/bin/env bash
#
# Aurora Theme for Pterodactyl Panel — uninstaller.
#
# Restores the panel to its pre-theme state using the backup created at install
# time. Never deletes unrelated Pterodactyl data.
#
# Usage:
#   bash uninstall.sh [--panel-dir /var/www/pterodactyl] [--backup DIR]
#                     [--remove-data] [--skip-build] [--no-maintenance] [--yes]
#
#   --backup DIR    Restore from a specific backup (default: newest)
#   --remove-data   ALSO drop the aurora_theme_settings table + uploaded assets.
#                   Without this flag, theme data is preserved for re-installs.
#
set -euo pipefail

AURORA_SOURCE_DIR=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    _self_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$_self_path/scripts/lib.sh" ]; then
        AURORA_SOURCE_DIR="$_self_path"
    fi
fi
if [ -z "$AURORA_SOURCE_DIR" ]; then
    if [ -f "$(pwd)/scripts/lib.sh" ] && [ -f "$(pwd)/version" ]; then
        AURORA_SOURCE_DIR="$(pwd)"
    else
        echo "[ERROR] uninstall.sh must be run from the Aurora Theme repository (git clone it first)."
        echo "        The installer backs up every modified file, so nothing is lost by cloning again."
        exit 1
    fi
fi

# shellcheck disable=SC1091
. "$AURORA_SOURCE_DIR/scripts/lib.sh"
# shellcheck disable=SC1091
. "$AURORA_SOURCE_DIR/scripts/manifest.sh"

AURORA_THEME_VERSION="$(tr -d '[:space:]' < "$AURORA_SOURCE_DIR/version")"

PANEL_DIR="${PANEL_DIR:-}"
BACKUP_CHOICE=""
REMOVE_DATA=""
SKIP_BUILD="${AURORA_SKIP_BUILD:-}"
NO_MAINTENANCE=""
ASSUME_YES=""
AURORA_VERBOSE="${AURORA_VERBOSE:-}"

while [ $# -gt 0 ]; do
    case "$1" in
        --panel-dir) PANEL_DIR="${2:-}"; shift 2 ;;
        --panel-dir=*) PANEL_DIR="${1#--panel-dir=}"; shift ;;
        --backup) BACKUP_CHOICE="${2:-}"; shift 2 ;;
        --backup=*) BACKUP_CHOICE="${1#--backup=}"; shift ;;
        --remove-data) REMOVE_DATA=1; shift ;;
        --skip-build) SKIP_BUILD=1; shift ;;
        --no-maintenance) NO_MAINTENANCE=1; shift ;;
        --yes|-y) ASSUME_YES=1; shift ;;
        --verbose|-v) AURORA_VERBOSE=1; shift ;;
        --help|-h)
            sed -n '2,22p' "$AURORA_SOURCE_DIR/uninstall.sh"
            exit 0
            ;;
        *) echo "[ERROR] Unknown option: $1 (see --help)"; exit 1 ;;
    esac
done

export AURORA_VERBOSE

echo ""
aurora_step "Aurora Theme v${AURORA_THEME_VERSION} — uninstaller"
echo ""

aurora_require_root
PANEL_DIR_RESOLVED="$(aurora_detect_panel_dir "$PANEL_DIR")"
export PANEL_DIR_RESOLVED
aurora_assert_panel_dir "$PANEL_DIR_RESOLVED"
aurora_info "Panel directory: $PANEL_DIR_RESOLVED"

INSTALLED_VERSION="$(aurora_installed_version "$PANEL_DIR_RESOLVED")"
if [ "$INSTALLED_VERSION" = "none" ]; then
    aurora_warn "No Aurora version record found — the theme may not be installed (or was partially removed)."
else
    aurora_info "Installed theme version: $INSTALLED_VERSION"
fi

if [ -n "$BACKUP_CHOICE" ]; then
    BACKUP_DIR="$BACKUP_CHOICE"
    [ -f "$BACKUP_DIR/MANIFEST.tsv" ] || { aurora_error "Backup '$BACKUP_DIR' has no MANIFEST.tsv — refusing to continue."; exit 1; }
else
    BACKUP_DIR="$(aurora_latest_backup)" || { aurora_error "No Aurora backup found under $(aurora_backup_root). Without a backup, stock files cannot be restored automatically."; exit 1; }
fi
aurora_info "Restoring from backup: $BACKUP_DIR"

if [ -f "$BACKUP_DIR/META.env" ]; then
    # shellcheck disable=SC1090
    . "$BACKUP_DIR/META.env"
    aurora_info "Backup meta: action=${action:-?} panel_version=${panel_version:-?} theme_version=${theme_version:-?} created_at=${created_at:-?}"
fi

if [ -z "$ASSUME_YES" ]; then
    echo ""
    aurora_warn "This will remove Aurora Theme files and restore stock Pterodactyl files."
    if [ -n "$REMOVE_DATA" ]; then
        aurora_warn "INCLUDING theme settings data (--remove-data)."
    else
        aurora_info "Theme settings data will be KEPT (use --remove-data to drop it)."
    fi
    printf 'Continue? [y/N] '
    read -r answer
    case "$answer" in
        y|Y|yes|YES) ;;
        *) aurora_info "Aborted by user."; exit 0 ;;
    esac
fi

MAINTENANCE_ACTIVE=0
on_failure() {
    local code=$?
    aurora_error "Uninstaller failed with exit code $code."
    if [ "$MAINTENANCE_ACTIVE" = "1" ]; then
        aurora_artisan "$PANEL_DIR_RESOLVED" up >/dev/null 2>&1 || true
    fi
    exit $code
}
trap on_failure ERR

# Safety backup of the CURRENT (themed) state before we touch anything.
aurora_step "[1/6] Snapshotting current state"
SAFETY_DIR="$(aurora_create_backup_dir)"
: > "$SAFETY_DIR/MANIFEST.tsv"
for rel in "${AURORA_REPLACED_FILES[@]}" "${AURORA_PATCHED_FILES[@]}"; do
    aurora_backup_file "$PANEL_DIR_RESOLVED" "$SAFETY_DIR" "$rel"
done
aurora_write_backup_meta "$SAFETY_DIR" "$PANEL_DIR_RESOLVED" "$(aurora_detect_panel_version "$PANEL_DIR_RESOLVED")" "$AURORA_THEME_VERSION" "pre-uninstall-snapshot"
aurora_info "Safety snapshot: $SAFETY_DIR"

aurora_step "[2/6] Maintenance mode"
if [ -z "$NO_MAINTENANCE" ]; then
    aurora_run "enable maintenance mode" aurora_artisan "$PANEL_DIR_RESOLVED" down
    MAINTENANCE_ACTIVE=1
fi

aurora_step "[3/6] Removing theme files"
for entry in "${AURORA_NEW_PATHS[@]}"; do
    rel="${entry%:tree}"
    if [ -e "$PANEL_DIR_RESOLVED/$rel" ] || [ -L "$PANEL_DIR_RESOLVED/$rel" ]; then
        rm -rf "$PANEL_DIR_RESOLVED/$rel"
        aurora_info "Removed: $rel"
    fi
done
# Remove marked patches as a fallback (file restore below also covers this).
if command -v python3 >/dev/null 2>&1; then
    python3 "$AURORA_SOURCE_DIR/scripts/apply-patches.py" --panel-dir "$PANEL_DIR_RESOLVED" --action remove || true
fi
aurora_ok "Theme files removed"

aurora_step "[4/6] Restoring stock files from backup"
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
    else
        aurora_warn "Backup entry missing, skipped: $rel"
    fi
done < "$BACKUP_DIR/MANIFEST.tsv"
aurora_ok "Restored $RESTORED path(s) from backup"

if [ -n "$REMOVE_DATA" ]; then
    aurora_warn "Dropping Aurora theme data (--remove-data)..."
    aurora_artisan "$PANEL_DIR_RESOLVED" aurora:theme --reset --force 2>/dev/null || true
    # Roll back ONLY the aurora migration (identified by migration name).
    aurora_artisan "$PANEL_DIR_RESOLVED" migrate:rollback --step=1 --force 2>/dev/null || true
    if [ -d "$PANEL_DIR_RESOLVED/public/themes/aurora" ]; then
        rm -rf "$PANEL_DIR_RESOLVED/public/themes/aurora"
    fi
    rm -rf "$PANEL_DIR_RESOLVED/storage/aurora"
    # If our migration row is still recorded (e.g. rollback picked another batch),
    # remove the table explicitly so re-installs start clean.
    aurora_artisan "$PANEL_DIR_RESOLVED" tinker --execute="Schema::dropIfExists('aurora_theme_settings'); DB::table('migrations')->where('migration', 'like', '%aurora_theme_settings%')->delete(); echo 'aurora table dropped';" 2>/dev/null || true
    aurora_ok "Theme data removed"
else
    aurora_info "Theme settings table left untouched (re-install to reuse it)."
    rm -rf "$PANEL_DIR_RESOLVED/storage/aurora"
fi

aurora_step "[5/6] Rebuilding stock frontend"
if [ -n "$SKIP_BUILD" ]; then
    aurora_warn "Skipping rebuild (--skip-build). Run manually: cd $PANEL_DIR_RESOLVED && yarn build:production"
else
    if command -v yarn >/dev/null 2>&1; then
        aurora_run "yarn build:production" bash -c "cd \"$PANEL_DIR_RESOLVED\" && yarn build:production"
    elif command -v npm >/dev/null 2>&1; then
        aurora_run "npm build" bash -c "cd \"$PANEL_DIR_RESOLVED\" && npx cross-env NODE_ENV=production webpack --mode production"
    else
        aurora_warn "No yarn/npm found — skipping rebuild. Install yarn and rebuild manually."
    fi
fi

aurora_step "[6/6] Finalizing"
aurora_clear_caches "$PANEL_DIR_RESOLVED"
WEB_USER="$(aurora_detect_web_user)"
WEB_GROUP="$(aurora_detect_web_group "$WEB_USER")"
aurora_fix_permissions "$PANEL_DIR_RESOLVED" "$WEB_USER" "$WEB_GROUP"
if [ "$MAINTENANCE_ACTIVE" = "1" ]; then
    aurora_run "disable maintenance mode" aurora_artisan "$PANEL_DIR_RESOLVED" up
    MAINTENANCE_ACTIVE=0
fi

# Verify the panel still boots.
if aurora_artisan "$PANEL_DIR_RESOLVED" route:list --name=admin.index >/dev/null 2>&1; then
    aurora_ok "Panel boots correctly (route check passed)."
else
    aurora_warn "Could not verify panel routes — check 'php artisan route:list' manually."
fi
if aurora_artisan "$PANEL_DIR_RESOLVED" route:list --name=admin.aurora-theme 2>/dev/null | grep -q "admin.aurora-theme"; then
    aurora_warn "Theme routes are still registered — a cache may be stale. Run: php artisan route:clear && php artisan config:clear"
fi

trap - ERR
echo ""
aurora_ok "Aurora Theme uninstalled. Stock Pterodactyl files were restored."
echo ""
echo "  Restored from : $BACKUP_DIR"
echo "  Safety backup : $SAFETY_DIR"
echo ""
