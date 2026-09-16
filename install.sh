#!/usr/bin/env bash
#
# Aurora Theme for Pterodactyl Panel — installer.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Recva-by-katsu/Theme2/main/install.sh | bash
#   wget -qO- https://raw.githubusercontent.com/Recva-by-katsu/Theme2/main/install.sh | bash
#
#   Or from a clone:
#   bash install.sh [--panel-dir /var/www/pterodactyl] [--force] [--skip-build]
#                   [--no-maintenance] [--yes] [--verbose]
#
# Exit codes: 0 success, 1 failure (with rollback attempted where possible).
#
set -euo pipefail

AURORA_REPO="${AURORA_REPO:-Recva-by-katsu/Theme2}"
AURORA_REF="${AURORA_REF:-main}"
AURORA_SUPPORTED_PANEL="${AURORA_SUPPORTED_PANEL:-1.14}"

# ---------------------------------------------------------------------------
# 0. Locate the theme source (supports piped execution via self-bootstrap).
# ---------------------------------------------------------------------------
AURORA_SOURCE_DIR=""
_self_path=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    _self_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
if [ -n "$_self_path" ] && [ -f "$_self_path/scripts/lib.sh" ]; then
    AURORA_SOURCE_DIR="$_self_path"
elif [ -f "$(pwd)/scripts/lib.sh" ] && [ -f "$(pwd)/version" ]; then
    AURORA_SOURCE_DIR="$(pwd)"
else
    # Piped execution: download the theme package from GitHub.
    echo "[INFO] No local theme source found — downloading Aurora Theme (${AURORA_REPO}@${AURORA_REF})..."
    _tmp="$(mktemp -d)"
    _tarball="$_tmp/aurora.tar.gz"
    _url="https://github.com/${AURORA_REPO}/archive/refs/heads/${AURORA_REF}.tar.gz"
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$_url" -o "$_tarball" || { echo "[ERROR] Download failed: $_url"; exit 1; }
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$_tarball" "$_url" || { echo "[ERROR] Download failed: $_url"; exit 1; }
    else
        echo "[ERROR] Neither curl nor wget is available. Install one of them and retry."
        exit 1
    fi
    tar -xzf "$_tarball" -C "$_tmp" || { echo "[ERROR] Failed to extract theme package."; exit 1; }
    AURORA_SOURCE_DIR="$(find "$_tmp" -maxdepth 1 -name '*-*' -type d | head -n 1)"
    if [ -z "$AURORA_SOURCE_DIR" ] || [ ! -f "$AURORA_SOURCE_DIR/scripts/lib.sh" ]; then
        echo "[ERROR] Downloaded package is invalid (missing scripts/lib.sh)."
        exit 1
    fi
    echo "[OK] Theme package ready at $AURORA_SOURCE_DIR"
fi

# shellcheck disable=SC1091
. "$AURORA_SOURCE_DIR/scripts/lib.sh"
# shellcheck disable=SC1091
. "$AURORA_SOURCE_DIR/scripts/manifest.sh"

AURORA_THEME_VERSION="$(tr -d '[:space:]' < "$AURORA_SOURCE_DIR/version")"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
PANEL_DIR="${PANEL_DIR:-}"
AURORA_FORCE="${AURORA_FORCE:-}"
SKIP_BUILD="${AURORA_SKIP_BUILD:-}"
NO_MAINTENANCE=""
ASSUME_YES=""
AURORA_VERBOSE="${AURORA_VERBOSE:-}"

while [ $# -gt 0 ]; do
    case "$1" in
        --panel-dir) PANEL_DIR="${2:-}"; shift 2 ;;
        --panel-dir=*) PANEL_DIR="${1#--panel-dir=}"; shift ;;
        --force|-f) AURORA_FORCE=1; shift ;;
        --skip-build) SKIP_BUILD=1; shift ;;
        --no-maintenance) NO_MAINTENANCE=1; shift ;;
        --yes|-y) ASSUME_YES=1; shift ;;
        --verbose|-v) AURORA_VERBOSE=1; shift ;;
        --help|-h)
            sed -n '2,20p' "$AURORA_SOURCE_DIR/install.sh"
            echo ""
            echo "Options:"
            echo "  --panel-dir PATH   Path to the Pterodactyl panel (default: auto-detect)"
            echo "  --force            Bypass version/support checks"
            echo "  --skip-build       Do not run yarn install / frontend build"
            echo "  --no-maintenance   Do not enable maintenance mode during install"
            echo "  --yes              Assume yes for prompts"
            echo "  --verbose          Show full command output"
            exit 0
            ;;
        *) aurora_fail "Unknown option: $1 (see --help)" ;;
    esac
done

export AURORA_FORCE AURORA_VERBOSE

echo ""
aurora_step "Aurora Theme v${AURORA_THEME_VERSION} — installer"
echo ""

# ---------------------------------------------------------------------------
# 1-6. Preflight: privileges, OS, panel detection, version, dependencies
# ---------------------------------------------------------------------------
aurora_step "[1/9] Preflight checks"
aurora_require_root
aurora_info "OS: $(aurora_detect_os)"

PANEL_DIR_RESOLVED="$(aurora_detect_panel_dir "$PANEL_DIR")"
export PANEL_DIR_RESOLVED
aurora_assert_panel_dir "$PANEL_DIR_RESOLVED"
aurora_info "Panel directory: $PANEL_DIR_RESOLVED"

PANEL_VERSION="$(aurora_detect_panel_version "$PANEL_DIR_RESOLVED")"
aurora_info "Panel version: $PANEL_VERSION (supported: ${AURORA_SUPPORTED_PANEL}.x)"
aurora_check_supported "$PANEL_VERSION" || exit 1

aurora_require_cmd php "Install PHP 8.2+ (the same binary the panel uses) and retry."
aurora_require_cmd python3 "Install python3 (used for safe surgical file patching) and retry."
if [ -z "$SKIP_BUILD" ]; then
    aurora_require_cmd node "Install Node.js 22+ (see panel BUILDING.md) or re-run with --skip-build."
    if ! command -v yarn >/dev/null 2>&1 && ! command -v npm >/dev/null 2>&1; then
        aurora_fail "Neither yarn nor npm was found. Install yarn (recommended) or re-run with --skip-build."
    fi
fi

WEB_USER="$(aurora_detect_web_user)"
WEB_GROUP="$(aurora_detect_web_group "$WEB_USER")"
aurora_info "File owner: $WEB_USER:$WEB_GROUP"

# Verify patch anchors BEFORE touching anything.
aurora_info "Verifying patch anchors against panel source..."
if ! python3 "$AURORA_SOURCE_DIR/scripts/apply-patches.py" --panel-dir "$PANEL_DIR_RESOLVED" --action check; then
    if [ -z "$AURORA_FORCE" ]; then
        aurora_fail "One or more patch anchors did not match. Your panel source differs from 1.14.1. Re-run with --force to try anyway (risky), or restore stock files first."
    fi
    aurora_warn "Continuing despite anchor mismatch (--force). The build may fail."
fi

INSTALLED_VERSION="$(aurora_installed_version "$PANEL_DIR_RESOLVED")"
if [ "$INSTALLED_VERSION" != "none" ]; then
    aurora_warn "Aurora Theme $INSTALLED_VERSION is already installed — this will reinstall/upgrade to $AURORA_THEME_VERSION."
    if [ "$INSTALLED_VERSION" = "$AURORA_THEME_VERSION" ] && [ -z "$ASSUME_YES" ]; then
        aurora_warn "Same version detected. Continuing will rebuild and re-apply all files (idempotent)."
    fi
fi
aurora_ok "Preflight complete"

# ---------------------------------------------------------------------------
# 7. Backup (files + database)
# ---------------------------------------------------------------------------
aurora_step "[2/9] Creating backup"
BACKUP_DIR="$(aurora_create_backup_dir)"
aurora_info "Backup location: $BACKUP_DIR"
: > "$BACKUP_DIR/MANIFEST.tsv"

for rel in "${AURORA_REPLACED_FILES[@]}" "${AURORA_PATCHED_FILES[@]}"; do
    aurora_backup_file "$PANEL_DIR_RESOLVED" "$BACKUP_DIR" "$rel"
done
# Compiled frontend assets (so a failed build can be rolled back).
if [ -d "$PANEL_DIR_RESOLVED/public/assets" ]; then
    aurora_backup_tree "$PANEL_DIR_RESOLVED" "$BACKUP_DIR" "public/assets"
fi
aurora_backup_database "$PANEL_DIR_RESOLVED" "$BACKUP_DIR"
aurora_write_backup_meta "$BACKUP_DIR" "$PANEL_DIR_RESOLVED" "$PANEL_VERSION" "$AURORA_THEME_VERSION" "install"
aurora_ok "Backup complete ($(wc -l < "$BACKUP_DIR/MANIFEST.tsv" | tr -d ' ') entries)"

# Rollback helper: restore files from this backup (used by the failure trap).
MAINTENANCE_ACTIVE=0
aurora_rollback_files() {
    aurora_warn "Attempting rollback from $BACKUP_DIR ..."
    if [ -f "$BACKUP_DIR/MANIFEST.tsv" ]; then
        while IFS=$'\t' read -r kind rel; do
            [ -z "$kind" ] && continue
            case "$kind" in
                database) continue ;;
                file|tree)
                    if [ -e "$BACKUP_DIR/files/$rel" ]; then
                        mkdir -p "$(dirname "$PANEL_DIR_RESOLVED/$rel")"
                        cp -a "$BACKUP_DIR/files/$rel" "$PANEL_DIR_RESOLVED/$rel"
                    fi
                    ;;
            esac
        done < "$BACKUP_DIR/MANIFEST.tsv"
        # Remove files the theme created (best effort).
        for entry in "${AURORA_NEW_PATHS[@]}"; do
            aurora_remove_if_exists "$PANEL_DIR_RESOLVED/${entry%:tree}"
        done
        aurora_info "Files restored from backup."
    fi
    if [ "$MAINTENANCE_ACTIVE" = "1" ]; then
        aurora_artisan "$PANEL_DIR_RESOLVED" up >/dev/null 2>&1 || true
        MAINTENANCE_ACTIVE=0
    fi
    aurora_clear_caches "$PANEL_DIR_RESOLVED"
}

on_failure() {
    local code=$?
    aurora_error "Installer failed with exit code $code."
    aurora_rollback_files
    aurora_error "Rollback attempted. Your backup remains at: $BACKUP_DIR"
    aurora_error "Database was NOT auto-restored. If migrations partially ran, restore manually:"
    aurora_error "  gunzip -c $BACKUP_DIR/database/*.sql.gz | mysql -u <user> -p <database>"
    exit $code
}
trap on_failure ERR

# ---------------------------------------------------------------------------
# 8. Maintenance mode
# ---------------------------------------------------------------------------
aurora_step "[3/9] Maintenance mode"
if [ -z "$NO_MAINTENANCE" ]; then
    aurora_run "enable maintenance mode" aurora_artisan "$PANEL_DIR_RESOLVED" down
    MAINTENANCE_ACTIVE=1
else
    aurora_warn "Skipping maintenance mode (--no-maintenance)."
fi

# ---------------------------------------------------------------------------
# 9-10. Install backend files + surgical patches
# ---------------------------------------------------------------------------
aurora_step "[4/9] Installing backend files"
while IFS='|' read -r src rel; do
    [ -z "$src" ] && continue
    case "$rel" in
        app/*|database/*|routes/*|config/*) aurora_install_file "$AURORA_SOURCE_DIR/$src" "$PANEL_DIR_RESOLVED/$rel" ;;
    esac
done < <(aurora_manifest_pairs)
for _php_file in app/Models/AuroraThemeSetting.php app/Services/AuroraThemeService.php app/Http/Controllers/Admin/AuroraThemeController.php app/Http/Controllers/AuroraPublicThemeController.php app/Http/Requests/Admin/AuroraThemeRequest.php app/Console/Commands/AuroraThemeCommand.php config/aurora.php routes/aurora.php; do
    aurora_run "php -l ${_php_file}" php -l "$PANEL_DIR_RESOLVED/${_php_file}"
done
aurora_ok "Backend files installed"

aurora_step "[5/9] Applying surgical patches"
aurora_run "apply core patches" python3 "$AURORA_SOURCE_DIR/scripts/apply-patches.py" --panel-dir "$PANEL_DIR_RESOLVED" --action apply
aurora_ok "Patches applied"

# ---------------------------------------------------------------------------
# 11. Migrations
# ---------------------------------------------------------------------------
aurora_step "[6/9] Running migrations"
aurora_run "run migrations" aurora_artisan "$PANEL_DIR_RESOLVED" migrate --force
aurora_run "seed/verify theme config" aurora_artisan "$PANEL_DIR_RESOLVED" aurora:theme --verify
aurora_ok "Migrations complete"

# ---------------------------------------------------------------------------
# 12-13. Install frontend + admin views + public assets
# ---------------------------------------------------------------------------
aurora_step "[7/9] Installing frontend, views and public assets"
while IFS='|' read -r src rel; do
    [ -z "$src" ] && continue
    case "$rel" in
        app/*|database/*|routes/*|config/*) continue ;;
        *) aurora_install_file "$AURORA_SOURCE_DIR/$src" "$PANEL_DIR_RESOLVED/$rel" ;;
    esac
done < <(aurora_manifest_pairs)

while IFS='|' read -r src dest; do
    [ -z "$src" ] && continue
    aurora_install_tree "$AURORA_SOURCE_DIR/$src" "$PANEL_DIR_RESOLVED/$dest"
done < <(aurora_manifest_trees)
aurora_ok "Theme files installed"

# ---------------------------------------------------------------------------
# 14. Frontend dependencies + build
# ---------------------------------------------------------------------------
aurora_step "[8/9] Building frontend"
if [ -n "$SKIP_BUILD" ]; then
    aurora_warn "Skipping frontend build (--skip-build). You MUST run the build manually:"
    aurora_warn "  cd $PANEL_DIR_RESOLVED && yarn install && yarn build:production"
else
    PKG_MANAGER="yarn"
    command -v yarn >/dev/null 2>&1 || PKG_MANAGER="npm"
    aurora_info "Using package manager: $PKG_MANAGER"
    if [ "$PKG_MANAGER" = "yarn" ]; then
        aurora_run "yarn install" bash -c "cd \"$PANEL_DIR_RESOLVED\" && yarn install --network-timeout 300000"
        aurora_run "yarn build:production" bash -c "cd \"$PANEL_DIR_RESOLVED\" && yarn build:production"
    else
        aurora_run "npm install" bash -c "cd \"$PANEL_DIR_RESOLVED\" && npm install --no-audit --no-fund"
        aurora_run "npm build" bash -c "cd \"$PANEL_DIR_RESOLVED\" && npx cross-env NODE_ENV=production webpack --mode production"
    fi
    if [ ! -f "$PANEL_DIR_RESOLVED/public/assets/manifest.json" ]; then
        aurora_fail "Frontend build did not produce public/assets/manifest.json. See the build output above."
    fi
    aurora_ok "Frontend build complete"
fi

# ---------------------------------------------------------------------------
# 15-17. Caches, permissions, up, verify
# ---------------------------------------------------------------------------
aurora_step "[9/9] Finalizing"
aurora_info "Clearing caches..."
aurora_clear_caches "$PANEL_DIR_RESOLVED"
aurora_info "Fixing ownership ($WEB_USER:$WEB_GROUP, no world-writable files)..."
aurora_fix_permissions "$PANEL_DIR_RESOLVED" "$WEB_USER" "$WEB_GROUP"

if [ "$MAINTENANCE_ACTIVE" = "1" ]; then
    aurora_run "disable maintenance mode" aurora_artisan "$PANEL_DIR_RESOLVED" up
    MAINTENANCE_ACTIVE=0
fi

aurora_info "Verifying installation..."
ERRORS=0
while IFS='|' read -r _src rel; do
    [ -z "$_src" ] && continue
    if [ ! -e "$PANEL_DIR_RESOLVED/$rel" ]; then
        aurora_error "Missing expected file: $rel"
        ERRORS=$((ERRORS + 1))
    fi
done < <(aurora_manifest_pairs)
for entry in "${AURORA_NEW_PATHS[@]}"; do
    if [ ! -e "$PANEL_DIR_RESOLVED/${entry%:tree}" ]; then
        aurora_error "Missing expected path: ${entry%:tree}"
        ERRORS=$((ERRORS + 1))
    fi
done
if ! aurora_artisan "$PANEL_DIR_RESOLVED" route:list --name=admin.aurora-theme 2>/dev/null | grep -q "admin.aurora-theme"; then
    aurora_error "Theme admin routes are not registered (route:list check failed)."
    ERRORS=$((ERRORS + 1))
fi
if ! aurora_artisan "$PANEL_DIR_RESOLVED" route:list --name=aurora.theme.config 2>/dev/null | grep -q "aurora.theme.config"; then
    aurora_error "Theme public route is not registered (route:list check failed)."
    ERRORS=$((ERRORS + 1))
fi
if [ "$ERRORS" -gt 0 ]; then
    aurora_fail "Verification failed with $ERRORS error(s). Check the messages above."
fi

aurora_record_version "$PANEL_DIR_RESOLVED" "$AURORA_THEME_VERSION"
trap - ERR

echo ""
aurora_ok "Aurora Theme v${AURORA_THEME_VERSION} installed successfully!"
echo ""
echo "  Theme settings :  https://your-panel/admin/aurora-theme"
echo "  Public config  :  https://your-panel/aurora/theme.json"
echo "  Backup         :  $BACKUP_DIR"
echo "  Version        :  $AURORA_THEME_VERSION (panel $PANEL_VERSION)"
echo ""
echo "  Update   :  bash update.sh [--panel-dir $PANEL_DIR_RESOLVED]"
echo "  Rollback :  bash update.sh --rollback [--panel-dir $PANEL_DIR_RESOLVED]"
echo "  Uninstall:  bash uninstall.sh [--panel-dir $PANEL_DIR_RESOLVED]"
echo ""
