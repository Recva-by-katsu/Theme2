#!/usr/bin/env bash
#
# Aurora Theme — shared shell library.
# Sourced by install.sh / update.sh / uninstall.sh. Must remain POSIX-friendly bash.
#
# shellcheck disable=SC2034

AURORA_LIB_VERSION="1.0.0"

# ---------------------------------------------------------------------------
# Logging helpers — [INFO] / [OK] / [WARN] / [ERROR]
# ---------------------------------------------------------------------------
_aurora_log() {
    local level="$1"; shift
    local color_reset="\033[0m"
    local color=""
    case "$level" in
        INFO)  color="\033[0;34m" ;;
        OK)    color="\033[0;32m" ;;
        WARN)  color="\033[1;33m" ;;
        ERROR) color="\033[0;31m" ;;
        STEP)  color="\033[0;36m" ;;
        *)     color="" ;;
    esac
    if [ -t 1 ] || [ -n "${AURORA_FORCE_COLOR:-}" ]; then
        printf '%b[%s]%b %s\n' "$color" "$level" "$color_reset" "$*"
    else
        printf '[%s] %s\n' "$level" "$*"
    fi
}

aurora_info()  { _aurora_log "INFO" "$@"; }
aurora_ok()    { _aurora_log "OK" "$@"; }
aurora_warn()  { _aurora_log "WARN" "$@"; }
aurora_error() { _aurora_log "ERROR" "$@"; }
aurora_step()  { _aurora_log "STEP" "$@"; }

aurora_fail() {
    aurora_error "$@"
    aurora_error "Installation FAILED. No further steps will run."
    exit 1
}

# Run a command, echo it in verbose mode, fail with context on error.
aurora_run() {
    local desc="$1"; shift
    if [ -n "${AURORA_VERBOSE:-}" ]; then
        aurora_info "\$ $*  (${desc})"
    fi
    local output
    if ! output="$("$@" 2>&1)"; then
        local code=$?
        aurora_error "Command failed (${desc}), exit code ${code}: $*"
        printf '%s\n' "$output" | head -n 40
        return $code
    fi
    if [ -n "${AURORA_VERBOSE:-}" ]; then
        printf '%s\n' "$output" | head -n 20
    fi
    return 0
}

# ---------------------------------------------------------------------------
# OS / environment detection
# ---------------------------------------------------------------------------
aurora_detect_os() {
    if [ -f /etc/os-release ]; then
        # shellcheck disable=SC1091
        . /etc/os-release
        printf '%s %s' "${ID:-unknown}" "${VERSION_ID:-}"
    else
        printf '%s' "$(uname -s)"
    fi
}

aurora_require_root() {
    if [ "$(id -u)" -ne 0 ] && [ -z "${AURORA_ALLOW_NON_ROOT:-}" ]; then
        aurora_fail "This script must be run as root (it modifies the panel installation and fixes file ownership). Re-run with sudo, or set AURORA_ALLOW_NON_ROOT=1 to override (not recommended)."
    fi
}

aurora_require_cmd() {
    local cmd="$1"
    local hint="${2:-}"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        if [ -n "$hint" ]; then
            aurora_fail "Required command '$cmd' was not found. $hint"
        else
            aurora_fail "Required command '$cmd' was not found. Please install it and re-run."
        fi
    fi
}

# ---------------------------------------------------------------------------
# Panel detection
# ---------------------------------------------------------------------------
# Resolves the Pterodactyl panel directory.
# Priority: --panel-dir flag / $PANEL_DIR env > common locations > composer.json probe.
aurora_detect_panel_dir() {
    local explicit="${1:-${PANEL_DIR:-}}"
    if [ -n "$explicit" ]; then
        if [ -d "$explicit" ]; then
            (cd "$explicit" && pwd)
            return 0
        fi
        aurora_fail "Panel directory '$explicit' does not exist. Pass --panel-dir /path/to/pterodactyl or set PANEL_DIR."
    fi

    local candidates=(
        "/var/www/pterodactyl"
        "/var/www/html/pterodactyl"
        "/srv/pterodactyl"
        "/opt/pterodactyl"
    )
    local dir
    for dir in "${candidates[@]}"; do
        if aurora_is_panel_dir "$dir"; then
            printf '%s' "$dir"
            return 0
        fi
    done

    # Last resort: current working directory.
    if aurora_is_panel_dir "$(pwd)"; then
        pwd
        return 0
    fi

    aurora_fail "Could not locate a Pterodactyl panel installation. Tried: ${candidates[*]}. Pass --panel-dir /path/to/pterodactyl or set PANEL_DIR."
}

aurora_is_panel_dir() {
    local dir="$1"
    [ -f "$dir/artisan" ] && [ -f "$dir/config/app.php" ] && [ -d "$dir/resources/scripts" ] && [ -d "$dir/app/Http/Controllers" ]
}

aurora_assert_panel_dir() {
    local dir="$1"
    aurora_is_panel_dir "$dir" || aurora_fail "'$dir' does not look like a Pterodactyl panel (missing artisan / config/app.php / resources/scripts). Aborting to avoid touching unrelated files."
}

# Detect panel version. Returns e.g. "1.14.1", "canary", or "unknown".
aurora_detect_panel_version() {
    local panel_dir="$1"
    local version="unknown"

    # Method 1: config/app.php 'version' key (release tarballs bake the version in).
    if [ -f "$panel_dir/config/app.php" ]; then
        version="$(grep -oE "'version'[[:space:]]*=>[[:space:]]*'[^']+'" "$panel_dir/config/app.php" | head -n 1 | sed -E "s/.*'([^']+)'\s*$/\1/" || true)"
    fi

    # Method 2: CHANGELOG.md top entry (present in git checkouts).
    if [ "$version" = "unknown" ] || [ "$version" = "canary" ] || [ -z "$version" ]; then
        if [ -f "$panel_dir/CHANGELOG.md" ]; then
            local changelog_version
            changelog_version="$(grep -m 1 -oE '^## v?[0-9]+\.[0-9]+\.[0-9]+' "$panel_dir/CHANGELOG.md" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n 1 || true)"
            if [ -n "$changelog_version" ]; then
                version="$changelog_version"
            fi
        fi
    fi

    # Method 3: git tag (development checkouts).
    if { [ "$version" = "unknown" ] || [ "$version" = "canary" ] || [ -z "$version" ]; } && [ -d "$panel_dir/.git" ]; then
        local git_version
        git_version="$(git -C "$panel_dir" describe --tags 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n 1 || true)"
        if [ -n "$git_version" ]; then
            version="$git_version"
        fi
    fi

    if [ -z "$version" ]; then
        version="unknown"
    fi
    printf '%s' "$version"
}

# Check that the panel version is supported. Returns 0 when supported (or forced).
aurora_check_supported() {
    local version="$1"
    local supported_major_minor="${AURORA_SUPPORTED_PANEL:-1.14}"

    if [ -n "${AURORA_FORCE:-}" ]; then
        aurora_warn "Version check bypassed via --force (detected panel version: ${version})."
        return 0
    fi

    case "$version" in
        canary|unknown)
            aurora_warn "Panel version is '${version}' — treating as a development checkout. Aurora targets Pterodactyl ${supported_major_minor}.x."
            aurora_warn "Continuing because the source layout will be verified file-by-file. Use --force to skip this warning."
            return 0
            ;;
        "${supported_major_minor}."*)
            return 0
            ;;
        *)
            aurora_error "Unsupported Pterodactyl version '${version}'. Aurora ${AURORA_THEME_VERSION:-} supports panel ${supported_major_minor}.x."
            aurora_error "Re-run with --force to attempt installation anyway (not recommended)."
            return 1
            ;;
    esac
}

# Detect the web-server user that should own panel files.
aurora_detect_web_user() {
    if [ -n "${WEB_USER:-}" ]; then
        printf '%s' "$WEB_USER"
        return 0
    fi
    # Prefer the current owner of the panel directory (preserves existing setups).
    if [ -n "${PANEL_DIR_RESOLVED:-}" ] && [ -d "$PANEL_DIR_RESOLVED" ]; then
        local owner
        owner="$(stat -c '%U' "$PANEL_DIR_RESOLVED" 2>/dev/null || stat -f '%Su' "$PANEL_DIR_RESOLVED" 2>/dev/null || true)"
        if [ -n "$owner" ] && [ "$owner" != "root" ] && [ "$owner" != "UNKNOWN" ]; then
            printf '%s' "$owner"
            return 0
        fi
    fi
    if id www-data >/dev/null 2>&1; then printf 'www-data'; return 0; fi
    if id nginx >/dev/null 2>&1; then printf 'nginx'; return 0; fi
    if id apache >/dev/null 2>&1; then printf 'apache'; return 0; fi
    printf 'www-data'
}

aurora_detect_web_group() {
    local user="$1"
    if [ -n "${WEB_GROUP:-}" ]; then printf '%s' "$WEB_GROUP"; return 0; fi
    id -gn "$user" 2>/dev/null || printf '%s' "$user"
}

# ---------------------------------------------------------------------------
# Backup helpers
# ---------------------------------------------------------------------------
aurora_backup_root() {
    printf '%s' "${AURORA_BACKUP_ROOT:-/var/backups/aurora-theme}"
}

# Create a timestamped backup dir, print its path.
aurora_create_backup_dir() {
    local root
    root="$(aurora_backup_root)"
    local stamp
    stamp="$(date +%Y%m%d-%H%M%S)"
    local dir="$root/$stamp"
    mkdir -p "$dir/files" "$dir/database"
    printf '%s' "$dir"
}

# Back up a single file (relative to panel dir) into the backup dir, preserving
# the relative path. Records every entry in the manifest.
aurora_backup_file() {
    local panel_dir="$1" backup_dir="$2" rel="$3"
    local src="$panel_dir/$rel"
    if [ ! -e "$src" ]; then
        return 0
    fi
    local dest="$backup_dir/files/$rel"
    mkdir -p "$(dirname "$dest")"
    cp -a "$src" "$dest"
    printf 'file\t%s\n' "$rel" >> "$backup_dir/MANIFEST.tsv"
}

# Back up a directory tree (relative to panel dir).
aurora_backup_tree() {
    local panel_dir="$1" backup_dir="$2" rel="$3"
    local src="$panel_dir/$rel"
    if [ ! -e "$src" ]; then
        return 0
    fi
    local dest="$backup_dir/files/$rel"
    mkdir -p "$(dirname "$dest")"
    cp -a "$src" "$dest"
    printf 'tree\t%s\n' "$rel" >> "$backup_dir/MANIFEST.tsv"
}

aurora_write_backup_meta() {
    local backup_dir="$1" panel_dir="$2" panel_version="$3" theme_version="$4" action="$5"
    {
        printf 'action=%s\n' "$action"
        printf 'created_at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        printf 'panel_dir=%s\n' "$panel_dir"
        printf 'panel_version=%s\n' "$panel_version"
        printf 'theme_version=%s\n' "$theme_version"
        printf 'hostname=%s\n' "$(hostname 2>/dev/null || echo unknown)"
    } > "$backup_dir/META.env"
}

# Dump the panel database using credentials from the panel .env.
aurora_backup_database() {
    local panel_dir="$1" backup_dir="$2"
    local env_file="$panel_dir/.env"
    if [ ! -f "$env_file" ]; then
        aurora_warn "No .env found at $env_file — skipping database backup."
        return 0
    fi
    # shellcheck disable=SC1090
    local db_connection db_host db_port db_database db_username db_password
    db_connection="$(grep -E '^DB_CONNECTION=' "$env_file" | cut -d= -f2- | tr -d '"' | tr -d "'" | head -n 1)"
    db_host="$(grep -E '^DB_HOST=' "$env_file" | cut -d= -f2- | tr -d '"' | tr -d "'" | head -n 1)"
    db_port="$(grep -E '^DB_PORT=' "$env_file" | cut -d= -f2- | tr -d '"' | tr -d "'" | head -n 1)"
    db_database="$(grep -E '^DB_DATABASE=' "$env_file" | cut -d= -f2- | tr -d '"' | tr -d "'" | head -n 1)"
    db_username="$(grep -E '^DB_USERNAME=' "$env_file" | cut -d= -f2- | tr -d '"' | tr -d "'" | head -n 1)"
    db_password="$(grep -E '^DB_PASSWORD=' "$env_file" | cut -d= -f2- | tr -d '"' | tr -d "'" | head -n 1)"
    db_connection="${db_connection:-mysql}"
    db_host="${db_host:-127.0.0.1}"
    db_port="${db_port:-3306}"

    if [ "$db_connection" != "mysql" ]; then
        aurora_warn "DB_CONNECTION is '$db_connection' (not mysql) — skipping automatic database dump. Back up manually if needed."
        return 0
    fi
    if ! command -v mysqldump >/dev/null 2>&1; then
        aurora_warn "mysqldump not found — skipping database backup. Install mariadb-client/mysql-client for automatic DB backups."
        return 0
    fi
    if [ -z "$db_database" ] || [ -z "$db_username" ]; then
        aurora_warn "Could not parse DB credentials from .env — skipping database backup."
        return 0
    fi
    aurora_info "Dumping database '$db_database'..."
    if MYSQL_PWD="$db_password" mysqldump -h "$db_host" -P "$db_port" -u "$db_username" \
        --single-transaction --routines --events \
        "$db_database" 2>"$backup_dir/database/mysqldump.stderr.log" | gzip -c > "$backup_dir/database/$db_database.sql.gz"; then
        rm -f "$backup_dir/database/mysqldump.stderr.log"
        printf 'database\t%s\n' "$db_database.sql.gz" >> "$backup_dir/MANIFEST.tsv"
        aurora_ok "Database backup written to database/$db_database.sql.gz"
    else
        aurora_warn "Database dump failed (see database/mysqldump.stderr.log). Continuing with file backup only."
    fi
}

# Find the newest backup dir containing a MANIFEST.
aurora_latest_backup() {
    local root
    root="$(aurora_backup_root)"
    if [ ! -d "$root" ]; then
        return 1
    fi
    local latest=""
    local d
    for d in "$root"/*/; do
        [ -f "$d/MANIFEST.tsv" ] || continue
        latest="$d"
    done
    if [ -z "$latest" ]; then
        return 1
    fi
    printf '%s' "${latest%/}"
    return 0
}

# ---------------------------------------------------------------------------
# File helpers
# ---------------------------------------------------------------------------
# Copy a theme overlay file into the panel, creating parent dirs.
aurora_install_file() {
    local src="$1" dest="$2"
    if [ ! -f "$src" ]; then
        aurora_fail "Theme package is missing expected file: $src. The download may be corrupt — re-download and retry."
    fi
    mkdir -p "$(dirname "$dest")"
    cp -a "$src" "$dest"
}

# Copy a whole directory (contents) into the panel.
aurora_install_tree() {
    local src="$1" dest="$2"
    if [ ! -d "$src" ]; then
        aurora_fail "Theme package is missing expected directory: $src. The download may be corrupt — re-download and retry."
    fi
    mkdir -p "$dest"
    cp -a "$src/." "$dest/"
}

# Remove a marked block (and only that block) from a file. Idempotent.
# Markers: $begin_marker ... $end_marker (full-line matches).
aurora_remove_marked_block() {
    local file="$1" begin_marker="$2" end_marker="$3"
    [ -f "$file" ] || return 0
    if grep -qF "$begin_marker" "$file"; then
        local tmp
        tmp="$(mktemp)"
        awk -v begin="$begin_marker" -v end="$end_marker" '
            $0 == begin { skip=1; next }
            $0 == end { skip=0; next }
            !skip { print }
        ' "$file" > "$tmp"
        cat "$tmp" > "$file"
        rm -f "$tmp"
    fi
}

# Ensure a directory is empty-ish safe to remove theme-only files from.
aurora_remove_if_exists() {
    local target="$1"
    if [ -e "$target" ] || [ -L "$target" ]; then
        rm -rf "$target"
    fi
}

# ---------------------------------------------------------------------------
# Artisan / caches / permissions
# ---------------------------------------------------------------------------
aurora_artisan() {
    local panel_dir="$1"; shift
    (cd "$panel_dir" && php artisan "$@")
}

aurora_clear_caches() {
    local panel_dir="$1"
    aurora_artisan "$panel_dir" view:clear >/dev/null 2>&1 || true
    aurora_artisan "$panel_dir" config:clear >/dev/null 2>&1 || true
    aurora_artisan "$panel_dir" route:clear >/dev/null 2>&1 || true
    aurora_artisan "$panel_dir" cache:clear >/dev/null 2>&1 || true
    aurora_artisan "$panel_dir" queue:restart >/dev/null 2>&1 || true
}

aurora_fix_permissions() {
    local panel_dir="$1" user="$2" group="$3"
    # Never chmod 777. Standard Pterodactyl ownership: web user, dirs 755 / files 644,
    # with storage/bootstrap/cache writable by the web user.
    chown -R "$user:$group" "$panel_dir"
    find "$panel_dir" -type d -exec chmod 755 {} \;
    find "$panel_dir" -type f -exec chmod 644 {} \;
    chmod -R u+rwX,go-w "$panel_dir/storage" "$panel_dir/bootstrap/cache" 2>/dev/null || true
    # artisan must stay executable, as must any shell tooling that ships executable.
    chmod +x "$panel_dir/artisan" 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Version record
# ---------------------------------------------------------------------------
aurora_record_version() {
    local panel_dir="$1" theme_version="$2"
    mkdir -p "$panel_dir/storage/aurora"
    printf '%s\n' "$theme_version" > "$panel_dir/storage/aurora/installed_version"
    printf '%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$panel_dir/storage/aurora/installed_at"
}

aurora_installed_version() {
    local panel_dir="$1"
    if [ -f "$panel_dir/storage/aurora/installed_version" ]; then
        tr -d '[:space:]' < "$panel_dir/storage/aurora/installed_version"
    else
        printf 'none'
    fi
}

# Compare dotted versions: returns 0 if $1 == $2, 1 if $1 < $2, 2 if $1 > $2.
aurora_vercmp() {
    local a="$1" b="$2"
    if [ "$a" = "$b" ]; then return 0; fi
    local lowest
    lowest="$(printf '%s\n%s\n' "$a" "$b" | sort -V | head -n 1)"
    if [ "$lowest" = "$a" ]; then return 1; else return 2; fi
}
