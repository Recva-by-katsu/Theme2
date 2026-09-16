#!/usr/bin/env bash
#
# Aurora Theme — smart dependency resolver.
#
# Detects everything the installer needs and (in "auto" mode) installs the
# missing pieces itself using the host package manager, instead of aborting
# with a "command not found" error. Inspired by a one-command install flow:
# the theme should never die just because Node.js or python3 is absent.
#
# Requires scripts/lib.sh to be sourced first (logging + aurora_vercmp).
#
# Modes (env AURORA_DEPS_MODE, or --no-deps from install.sh):
#   auto  (default) — audit, show a plan, install missing packages, verify.
#   off             — legacy strict behaviour: fail immediately with a
#                     manual-install hint, exactly like the old installer.
#
# Other knobs (env):
#   AURORA_NODE_MAJOR             Node major installed when Node is absent or
#                                 too old (default: 22, via NodeSource on
#                                 apt/dnf/yum, distro packages elsewhere).
#   AURORA_NODE_MIN_MAJOR         Oldest acceptable existing Node major
#                                 (default: 16 — webpack 5 cannot build below).
#   AURORA_NODE_RECOMMENDED_MAJOR Node major we recommend (default: 22).
#   AURORA_PHP_MIN                Hard minimum PHP version (default: 8.1).
#   AURORA_PHP_RECOMMENDED        Recommended PHP version (default: 8.2).
#   AURORA_DEPS_DRY_RUN=1         Audit + plan only; install nothing.
#
# shellcheck disable=SC2034

AURORA_DEPS_MODE="${AURORA_DEPS_MODE:-auto}"
AURORA_NODE_MAJOR="${AURORA_NODE_MAJOR:-22}"
AURORA_NODE_MIN_MAJOR="${AURORA_NODE_MIN_MAJOR:-16}"
AURORA_NODE_RECOMMENDED_MAJOR="${AURORA_NODE_RECOMMENDED_MAJOR:-22}"
AURORA_PHP_MIN="${AURORA_PHP_MIN:-8.1}"
AURORA_PHP_RECOMMENDED="${AURORA_PHP_RECOMMENDED:-8.2}"

AURORA_DEPS_TODO=()
_AURORA_DEPS_REFRESHED=0

# ---------------------------------------------------------------------------
# OS / package-manager detection
# ---------------------------------------------------------------------------

# Echoes "id|id_like|codename" from /etc/os-release without polluting globals.
aurora_deps_os_info() {
    (
        id="unknown"; id_like=""; codename=""
        if [ -f /etc/os-release ]; then
            # shellcheck disable=SC1091
            . /etc/os-release
            id="${ID:-unknown}"
            id_like="${ID_LIKE:-}"
            codename="${VERSION_CODENAME:-}"
        fi
        printf '%s|%s|%s' "$id" "$id_like" "$codename"
    )
}

# Detect the system package manager. Echoes: apt|dnf|yum|zypper|pacman|apk|none
aurora_deps_pkg_manager() {
    local m
    for m in apt-get dnf yum zypper pacman apk; do
        if command -v "$m" >/dev/null 2>&1; then
            case "$m" in
                apt-get) printf 'apt' ;;
                *)       printf '%s' "$m" ;;
            esac
            return 0
        fi
    done
    printf 'none'
    return 1
}

# Run a privileged command: direct as root, via sudo otherwise.
_aurora_deps_as_root() {
    if [ "$(id -u)" -eq 0 ]; then
        "$@"
    elif command -v sudo >/dev/null 2>&1; then
        sudo "$@"
    else
        return 1
    fi
}

# Run an install-ish command: stream in verbose mode, otherwise capture and
# show only the tail on failure. Returns the command's exit status.
_aurora_deps_run() {
    local desc="$1"; shift
    if [ -n "${AURORA_VERBOSE:-}" ]; then
        aurora_info "\$ $*  (${desc})"
        "$@"
        return $?
    fi
    local out
    if ! out="$("$@" 2>&1)"; then
        aurora_warn "Command failed (${desc}): $*"
        printf '%s\n' "$out" | tail -n 25
        return 1
    fi
    return 0
}

# Refresh package metadata once per run. Failures are surfaced (a stale/empty
# cache makes later installs fail with confusing "package not found" errors).
_aurora_deps_refresh() {
    [ "$_AURORA_DEPS_REFRESHED" = "1" ] && return 0
    local mgr="$1"
    local ok=0
    case "$mgr" in
        apt)    if _aurora_deps_run "refresh apt metadata" _aurora_deps_as_root env DEBIAN_FRONTEND=noninteractive apt-get update -qq; then ok=1; fi ;;
        dnf)    if _aurora_deps_run "refresh dnf metadata" _aurora_deps_as_root dnf -y -q makecache; then ok=1; fi ;;
        yum)    if _aurora_deps_run "refresh yum metadata" _aurora_deps_as_root yum -y -q makecache; then ok=1; fi ;;
        zypper) if _aurora_deps_run "refresh zypper metadata" _aurora_deps_as_root zypper -n refresh; then ok=1; fi ;;
        pacman) ok=1 ;;  # pacman -Sy happens per install below
        apk)    if _aurora_deps_run "refresh apk metadata" _aurora_deps_as_root apk update; then ok=1; fi ;;
        *)      ok=1 ;;
    esac
    if [ "$ok" != "1" ]; then
        aurora_warn "Could not refresh the $mgr package metadata — installs below may fail with 'package not found'."
        aurora_warn "Check the network/proxy and refresh package lists manually (e.g. 'apt-get update' / 'dnf makecache'), then retry."
    fi
    _AURORA_DEPS_REFRESHED=1
    return 0
}

# Install distro packages with the detected package manager.
# Usage: aurora_deps_pkg_install <mgr> <pkg> [pkg...]
aurora_deps_pkg_install() {
    local mgr="$1"; shift
    [ "$#" -eq 0 ] && return 0
    _aurora_deps_refresh "$mgr"
    case "$mgr" in
        apt)    _aurora_deps_run "apt-get install $*" _aurora_deps_as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y "$@" ;;
        dnf)    _aurora_deps_run "dnf install $*" _aurora_deps_as_root dnf install -y -q "$@" ;;
        yum)    _aurora_deps_run "yum install $*" _aurora_deps_as_root yum install -y -q "$@" ;;
        zypper) _aurora_deps_run "zypper install $*" _aurora_deps_as_root zypper --non-interactive install --no-recommends "$@" ;;
        pacman) _aurora_deps_run "pacman install $*" _aurora_deps_as_root pacman -Sy --needed --noconfirm "$@" ;;
        apk)    _aurora_deps_run "apk add $*" _aurora_deps_as_root apk add "$@" ;;
        *)      return 1 ;;
    esac
}

# Map a logical package to distro package names.
# Usage: _aurora_deps_pkg_names <mgr> <logical> -> space-separated names
_aurora_deps_pkg_names() {
    local mgr="$1" logical="$2"
    case "$logical" in
        curl|wget|tar|gzip|ca-certificates)
            printf '%s' "$logical" ;;
        python3)
            case "$mgr" in
                pacman) printf 'python' ;;
                *)      printf 'python3' ;;
            esac ;;
        gnupg)
            case "$mgr" in
                dnf|yum) printf 'gnupg2' ;;
                zypper)  printf 'gpg2' ;;
                *)       printf 'gnupg' ;;
            esac ;;
        mariadb-client)
            case "$mgr" in
                dnf|yum) printf 'mariadb' ;;
                pacman)  printf 'mariadb-clients' ;;
                *)       printf 'mariadb-client' ;;
            esac ;;
        php)
            case "$mgr" in
                apt)
                    printf 'php-cli php-mbstring php-xml php-curl php-mysql php-gd php-zip php-bcmath php-intl' ;;
                dnf|yum)
                    printf 'php-cli php-mbstring php-xml php-mysqlnd php-gd php-bcmath php-intl php-zip php-process' ;;
                zypper)
                    printf 'php8 php8-mbstring php8-xmlreader php8-xmlwriter php8-curl php8-mysql php8-gd php8-zip php8-bcmath php8-intl' ;;
                pacman)
                    printf 'php' ;;
                apk)
                    printf 'php-cli php-mbstring php-xml php-curl php-mysqli php-gd php-zip php-bcmath php-intl' ;;
            esac ;;
        nodejs-distro)
            case "$mgr" in
                zypper|pacman|apk) printf 'nodejs npm' ;;
                *)                 printf 'nodejs' ;;
            esac ;;
        *) printf '%s' "$logical" ;;
    esac
}

# ---------------------------------------------------------------------------
# Version probes
# ---------------------------------------------------------------------------

_aurora_deps_node_major() {
    # Echoes the installed Node major version, or 0 when absent/unparseable.
    command -v node >/dev/null 2>&1 || { printf '0'; return 0; }
    local v
    v="$(node -v 2>/dev/null | sed -E 's/^v//; s/\..*$//' | head -n 1)"
    case "$v" in
        ''|*[!0-9]*) printf '0' ;;
        *)           printf '%s' "$v" ;;
    esac
}

_aurora_deps_php_version() {
    # Echoes "MAJOR.MINOR" of the php CLI, or "none".
    command -v php >/dev/null 2>&1 || { printf 'none'; return 0; }
    local v
    v="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null | head -n 1)"
    case "$v" in
        ''|*[!0-9.]*) printf 'none' ;;
        *)            printf '%s' "$v" ;;
    esac
}

# ---------------------------------------------------------------------------
# Audit (read-only) — fills AURORA_DEPS_TODO with logical names:
#   core python3 php nodejs yarn mariadb-client
# and prints a per-tool status line.
# ---------------------------------------------------------------------------

_aurora_deps_line() {
    aurora_info "$(printf '  %-12s %s' "$1" "$2")"
}

_aurora_deps_audit() {
    local skip_build="${SKIP_BUILD:-}"
    local mgr
    mgr="$(aurora_deps_pkg_manager || true)"   # "none" exits 1; keep set -e happy
    local os_info
    os_info="$(aurora_deps_os_info)"
    if [ "$mgr" != "none" ]; then
        aurora_info "Package manager: $mgr ($(printf '%s' "$os_info" | cut -d'|' -f1))"
    else
        aurora_warn "Package manager: NOT DETECTED — automatic installs are unavailable."
    fi

    # -- core transport tools ------------------------------------------------
    local core_missing=""
    command -v tar  >/dev/null 2>&1 || core_missing="$core_missing tar"
    command -v gzip >/dev/null 2>&1 || core_missing="$core_missing gzip"
    # curl is required (NodeSource/bootstrap prefer it over wget).
    command -v curl >/dev/null 2>&1 || core_missing="$core_missing curl"
    if [ -n "${core_missing# }" ]; then
        _aurora_deps_line "core" "missing:${core_missing} → will install"
        AURORA_DEPS_TODO+=("core")
    else
        _aurora_deps_line "core" "present (curl, tar, gzip)"
    fi

    # -- python3 (surgical patch engine) -------------------------------------
    if command -v python3 >/dev/null 2>&1; then
        _aurora_deps_line "python3" "present ($(python3 --version 2>&1 | awk '{print $2}'))"
    else
        _aurora_deps_line "python3" "missing → will install python3"
        AURORA_DEPS_TODO+=("python3")
    fi

    # -- php -----------------------------------------------------------------
    local phpv
    phpv="$(_aurora_deps_php_version)"
    if [ "$phpv" = "none" ]; then
        _aurora_deps_line "php" "missing → will install PHP CLI + extensions"
        AURORA_DEPS_TODO+=("php")
    else
        set +e
        aurora_vercmp "$phpv" "$AURORA_PHP_MIN"
        local cmp=$?
        set -e
        if [ "$cmp" -eq 1 ]; then
            _aurora_deps_line "php" "v${phpv} — TOO OLD (need >= ${AURORA_PHP_MIN}); will NOT auto-replace a live PHP"
            _aurora_deps_line ""  "↑ upgrade manually (e.g. ppa:ondrej/php / packages.sury.org), then re-run"
        else
            if [ "$phpv" != "$AURORA_PHP_RECOMMENDED" ]; then
                set +e
                aurora_vercmp "$phpv" "$AURORA_PHP_RECOMMENDED"
                cmp=$?
                set -e
                if [ "$cmp" -eq 1 ]; then
                    _aurora_deps_line "php" "v${phpv} — OK (${AURORA_PHP_RECOMMENDED}+ recommended)"
                else
                    _aurora_deps_line "php" "v${phpv}"
                fi
            else
                _aurora_deps_line "php" "v${phpv}"
            fi
        fi
    fi

    # -- node / yarn (only when a frontend build will run) --------------------
    if [ -z "$skip_build" ]; then
        local node_major
        node_major="$(_aurora_deps_node_major)"
        if [ "$node_major" -eq 0 ]; then
            _aurora_deps_line "node" "missing → will install Node.js ${AURORA_NODE_MAJOR}.x"
            AURORA_DEPS_TODO+=("nodejs")
        elif [ "$node_major" -lt "$AURORA_NODE_MIN_MAJOR" ]; then
            _aurora_deps_line "node" "$(node -v 2>/dev/null) — too old (need >= ${AURORA_NODE_MIN_MAJOR}) → will upgrade to ${AURORA_NODE_MAJOR}.x"
            AURORA_DEPS_TODO+=("nodejs")
        else
            if [ "$node_major" -lt "$AURORA_NODE_RECOMMENDED_MAJOR" ]; then
                _aurora_deps_line "node" "$(node -v 2>/dev/null) — OK (${AURORA_NODE_RECOMMENDED_MAJOR}+ recommended)"
            else
                _aurora_deps_line "node" "$(node -v 2>/dev/null)"
            fi
        fi

        if command -v yarn >/dev/null 2>&1; then
            _aurora_deps_line "yarn" "present ($(yarn -v 2>/dev/null | head -n 1))"
        else
            _aurora_deps_line "yarn" "missing → will install via corepack/npm (npm fallback supported)"
            AURORA_DEPS_TODO+=("yarn")
        fi
    else
        _aurora_deps_line "node/yarn" "skipped (--skip-build)"
    fi

    # -- mysqldump (optional: automatic database backups) ---------------------
    local env_file="${PANEL_DIR_RESOLVED:-}/.env"
    if [ -n "${PANEL_DIR_RESOLVED:-}" ] && [ -f "$env_file" ]; then
        local db_connection
        db_connection="$(grep -E '^DB_CONNECTION=' "$env_file" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" | head -n 1 || true)"
        db_connection="${db_connection:-mysql}"
        if [ "$db_connection" = "mysql" ] && ! command -v mysqldump >/dev/null 2>&1; then
            _aurora_deps_line "mysqldump" "missing → will install DB client (enables auto DB backup; best-effort)"
            AURORA_DEPS_TODO+=("mariadb-client")
        elif [ "$db_connection" = "mysql" ]; then
            _aurora_deps_line "mysqldump" "present (database backups enabled)"
        else
            _aurora_deps_line "mysqldump" "skipped (DB_CONNECTION=$db_connection)"
        fi
    else
        _aurora_deps_line "mysqldump" "skipped (no panel .env yet)"
    fi
}

# ---------------------------------------------------------------------------
# Fixes (mutating) — one per logical name, self-verifying.
# ---------------------------------------------------------------------------

_aurora_deps_fix_core() {
    local mgr="$1"
    aurora_info "Installing core tools (curl, tar, gzip, ca-certificates)..."
    # shellcheck disable=SC2046
    aurora_deps_pkg_install "$mgr" ca-certificates \
        $(_aurora_deps_pkg_names "$mgr" curl) \
        $(_aurora_deps_pkg_names "$mgr" tar) \
        $(_aurora_deps_pkg_names "$mgr" gzip) || true
    local missing=""
    command -v tar  >/dev/null 2>&1 || missing="$missing tar"
    command -v gzip >/dev/null 2>&1 || missing="$missing gzip"
    command -v curl >/dev/null 2>&1 || command -v wget >/dev/null 2>&1 || missing="$missing curl"
    if [ -n "${missing# }" ]; then
        aurora_fail "Core tools still missing after install attempt:${missing}. Install them manually (e.g. 'apt-get install -y${missing}') and re-run."
    fi
    aurora_ok "Core tools ready"
}

_aurora_deps_fix_python3() {
    local mgr="$1"
    aurora_info "Installing python3..."
    # shellcheck disable=SC2046
    aurora_deps_pkg_install "$mgr" $(_aurora_deps_pkg_names "$mgr" python3) || true
    command -v python3 >/dev/null 2>&1 || \
        aurora_fail "python3 is still missing after the install attempt. Install it manually (apt/dnf/yum/zypper/pacman/apk → 'python3') and re-run."
    aurora_ok "python3 ready ($(python3 --version 2>&1 | awk '{print $2}'))"
}

# Add a modern PHP repository on legacy Debian/Ubuntu so php >= 8.2 exists.
_aurora_deps_php_modern_repo() {
    local mgr="$1" os_info="$2"
    [ "$mgr" = "apt" ] || return 1
    local id codename
    id="$(printf '%s' "$os_info" | cut -d'|' -f1)"
    codename="$(printf '%s' "$os_info" | cut -d'|' -f3)"
    # shellcheck disable=SC2046
    aurora_deps_pkg_install apt ca-certificates curl $(_aurora_deps_pkg_names apt gnupg) || true
    case "$id" in
        ubuntu)
            aurora_deps_pkg_install apt software-properties-common || true
            _aurora_deps_run "add ppa:ondrej/php" _aurora_deps_as_root add-apt-repository -y ppa:ondrej/php || return 1
            ;;
        debian)
            [ -n "$codename" ] || return 1
            _aurora_deps_run "fetch sury.org key" _aurora_deps_as_root bash -c \
                "curl -fsSL https://packages.sury.org/php/apt.gpg | gpg --dearmor -o /usr/share/keyrings/deb.sury.org-php.gpg" || return 1
            printf 'deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ %s main\n' "$codename" \
                | _aurora_deps_as_root tee /etc/apt/sources.list.d/php-sury.list >/dev/null || return 1
            ;;
        *) return 1 ;;
    esac
    _AURORA_DEPS_REFRESHED=0
    _aurora_deps_refresh apt
    return 0
}

_aurora_deps_fix_php() {
    local mgr="$1" os_info="$2"
    aurora_info "Installing PHP CLI + extensions..."
    # shellcheck disable=SC2046
    aurora_deps_pkg_install "$mgr" $(_aurora_deps_pkg_names "$mgr" php) || true
    local phpv
    phpv="$(_aurora_deps_php_version)"
    if [ "$phpv" != "none" ]; then
        set +e
        aurora_vercmp "$phpv" "$AURORA_PHP_MIN"
        local cmp=$?
        set -e
        [ "$cmp" -ne 1 ] && { aurora_ok "PHP ready (v${phpv})"; return 0; }
    fi
    # Distro PHP is absent or too old — try a modern repo on Debian/Ubuntu.
    aurora_warn "Default repositories provide no PHP >= ${AURORA_PHP_MIN}; trying a modern PHP repository..."
    if [ "$mgr" = "apt" ] && _aurora_deps_php_modern_repo "$mgr" "$os_info"; then
        aurora_deps_pkg_install apt \
            php8.2-cli php8.2-mbstring php8.2-xml php8.2-curl php8.2-mysql \
            php8.2-gd php8.2-zip php8.2-bcmath php8.2-intl || true
        if command -v php8.2 >/dev/null 2>&1 && [ "$(readlink -f "$(command -v php)")" != "$(command -v php8.2)" ]; then
            _aurora_deps_as_root update-alternatives --set php "$(command -v php8.2)" >/dev/null 2>&1 || true
        fi
        phpv="$(_aurora_deps_php_version)"
        if [ "$phpv" != "none" ]; then
            set +e
            aurora_vercmp "$phpv" "$AURORA_PHP_MIN"
            cmp=$?
            set -e
            [ "$cmp" -ne 1 ] && { aurora_ok "PHP ready (v${phpv})"; return 0; }
        fi
    fi
    aurora_fail "Could not install PHP >= ${AURORA_PHP_MIN} automatically. Install PHP ${AURORA_PHP_RECOMMENDED}+ manually (panel BUILDING.md / ppa:ondrej/php / packages.sury.org / REMI repo) and re-run."
}

_aurora_deps_fix_nodejs() {
    local mgr="$1" os_info="$2"
    local installed=0

    case "$mgr" in
        apt|dnf|yum)
            # NodeSource ships current, supported Node lines (distro repos lag
            # far behind and often offer Node < 16 which cannot build the panel).
            # shellcheck disable=SC2046
            aurora_deps_pkg_install "$mgr" ca-certificates curl $(_aurora_deps_pkg_names "$mgr" gnupg) || true
            local ns_base="https://deb.nodesource.com"
            [ "$mgr" != "apt" ] && ns_base="https://rpm.nodesource.com"
            local ns_script
            ns_script="$(mktemp /tmp/aurora-nodesource.XXXXXX.sh)"
            if command -v curl >/dev/null 2>&1 && \
               curl -fsSL "${ns_base}/setup_${AURORA_NODE_MAJOR}.x" -o "$ns_script" 2>/dev/null; then
                if _aurora_deps_run "NodeSource Node.js ${AURORA_NODE_MAJOR}.x repository" _aurora_deps_as_root bash "$ns_script"; then
                    _AURORA_DEPS_REFRESHED=1   # the setup script already refreshes metadata
                    if aurora_deps_pkg_install "$mgr" nodejs; then
                        installed=1
                    fi
                fi
            else
                aurora_warn "Could not download the NodeSource setup script (network/proxy issue?)."
            fi
            rm -f "$ns_script"
            ;;
        *)
            : # fall through to distro packages below
            ;;
    esac

    if [ "$installed" != "1" ]; then
        [ "$mgr" != "none" ] && \
            aurora_warn "Falling back to the distribution's nodejs package (may be older than ${AURORA_NODE_MAJOR}.x)..."
        # shellcheck disable=SC2046
        [ "$mgr" != "none" ] && \
            aurora_deps_pkg_install "$mgr" $(_aurora_deps_pkg_names "$mgr" nodejs-distro) || true
    fi

    local major
    major="$(_aurora_deps_node_major)"
    if [ "$major" -eq 0 ]; then
        aurora_fail "Node.js could not be installed automatically. Install Node.js ${AURORA_NODE_MAJOR}+ manually (https://nodejs.org or NodeSource) and re-run — or re-run with --skip-build and build the frontend yourself."
    fi
    if [ "$major" -lt "$AURORA_NODE_MIN_MAJOR" ]; then
        aurora_fail "Node.js $(node -v 2>/dev/null) is too old (need >= ${AURORA_NODE_MIN_MAJOR}; ${AURORA_NODE_MAJOR}+ recommended). Upgrade Node manually and re-run — or re-run with --skip-build."
    fi
    aurora_ok "Node.js ready ($(node -v 2>/dev/null), npm $(command -v npm >/dev/null 2>&1 && npm -v 2>/dev/null | head -n 1 || echo 'missing'))"
}

_aurora_deps_fix_yarn() {
    # Node (and thus npm) must exist at this point; yarn is best-effort because
    # the installer can always fall back to npm.
    command -v yarn >/dev/null 2>&1 && return 0
    aurora_info "Installing yarn (preferred package manager)..."
    # Preferred: corepack (bundled with Node >= 16.10, zero global packages).
    if command -v corepack >/dev/null 2>&1; then
        _aurora_deps_run "enable corepack" _aurora_deps_as_root corepack enable || true
        _aurora_deps_run "activate yarn via corepack" _aurora_deps_as_root corepack prepare yarn@stable --activate || true
    fi
    if ! command -v yarn >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
        _aurora_deps_run "npm install -g yarn" _aurora_deps_as_root npm install -g yarn || true
    fi
    if command -v yarn >/dev/null 2>&1; then
        aurora_ok "yarn ready ($(yarn -v 2>/dev/null | head -n 1))"
    elif command -v npm >/dev/null 2>&1; then
        aurora_warn "yarn could not be installed — continuing with npm (fully supported)."
    else
        aurora_warn "Neither yarn nor npm is available yet; final verification will catch this."
    fi
    return 0
}

_aurora_deps_fix_mariadb_client() {
    local mgr="$1"
    aurora_info "Installing database client (mysqldump) for automatic DB backups..."
    # shellcheck disable=SC2046
    aurora_deps_pkg_install "$mgr" $(_aurora_deps_pkg_names "$mgr" mariadb-client) || true
    if command -v mysqldump >/dev/null 2>&1; then
        aurora_ok "mysqldump ready ($(mysqldump --version 2>/dev/null | head -n 1))"
    else
        # Optional dependency: the installer simply skips the DB dump without it.
        aurora_warn "mysqldump is still unavailable — the database backup step will be skipped with a warning (install mariadb-client/mysql-client to enable it)."
    fi
    return 0
}

# ---------------------------------------------------------------------------
# Strict mode (--no-deps): identical to the legacy installer behaviour.
# ---------------------------------------------------------------------------

_aurora_deps_strict_check() {
    local skip_build="${SKIP_BUILD:-}"
    aurora_info "Dependency auto-install disabled (--no-deps) — running strict checks."
    aurora_require_cmd php "Install PHP 8.2+ (the same binary the panel uses) and retry."
    aurora_require_cmd python3 "Install python3 (used for safe surgical file patching) and retry."
    if [ -z "$skip_build" ]; then
        aurora_require_cmd node "Install Node.js 22+ (see panel BUILDING.md) or re-run with --skip-build."
        if ! command -v yarn >/dev/null 2>&1 && ! command -v npm >/dev/null 2>&1; then
            aurora_fail "Neither yarn nor npm was found. Install yarn (recommended) or re-run with --skip-build."
        fi
    fi
}

# ---------------------------------------------------------------------------
# Final verification — hard-fail with a consolidated hint if anything the
# installer is about to use is still missing.
# ---------------------------------------------------------------------------

_aurora_deps_verify() {
    local skip_build="${SKIP_BUILD:-}"
    local problems=""

    if ! command -v php >/dev/null 2>&1; then
        problems="$problems php"
    else
        local phpv
        phpv="$(_aurora_deps_php_version)"
        set +e
        aurora_vercmp "$phpv" "$AURORA_PHP_MIN"
        local cmp=$?
        set -e
        if [ "$phpv" = "none" ] || [ "$cmp" -eq 1 ]; then
            if [ -n "${AURORA_FORCE:-}" ]; then
                aurora_warn "PHP ${phpv} is below ${AURORA_PHP_MIN} — continuing anyway (--force). Migrations may fail."
            else
                problems="$problems php-too-old(${phpv})"
            fi
        fi
    fi
    command -v python3 >/dev/null 2>&1 || problems="$problems python3"
    if [ -z "$skip_build" ]; then
        command -v node >/dev/null 2>&1 || problems="$problems node"
        if ! command -v yarn >/dev/null 2>&1 && ! command -v npm >/dev/null 2>&1; then
            problems="$problems yarn-or-npm"
        fi
    fi

    if [ -n "${problems# }" ]; then
        aurora_error "Unsatisfied dependencies:${problems}"
        aurora_error "Install them manually and re-run. Typical commands:"
        aurora_error "  Debian/Ubuntu : apt-get install -y php-cli python3 && curl -fsSL https://deb.nodesource.com/setup_${AURORA_NODE_MAJOR}.x | bash - && apt-get install -y nodejs"
        aurora_error "  RHEL family   : dnf install -y php-cli python3 && curl -fsSL https://rpm.nodesource.com/setup_${AURORA_NODE_MAJOR}.x | bash - && dnf install -y nodejs"
        aurora_error "Hint: --skip-build drops the Node.js/yarn requirement; --no-deps only disables auto-install."
        aurora_fail "Dependency resolution failed."
    fi
}

# ---------------------------------------------------------------------------
# Entry point — called once by install.sh during preflight.
# Reads: SKIP_BUILD, ASSUME_YES, AURORA_DEPS_MODE, AURORA_DEPS_DRY_RUN,
#        PANEL_DIR_RESOLVED (for mysqldump/.env detection), AURORA_FORCE.
# ---------------------------------------------------------------------------

aurora_ensure_dependencies() {
    if [ "${AURORA_DEPS_MODE:-auto}" = "off" ]; then
        _aurora_deps_strict_check
        return 0
    fi

    if [ "${AURORA_DEPS_MODE:-auto}" != "auto" ]; then
        aurora_warn "Unknown AURORA_DEPS_MODE='${AURORA_DEPS_MODE}' — falling back to 'auto'."
        AURORA_DEPS_MODE="auto"
    fi

    aurora_info "Smart dependency scan (auto-install enabled; use --no-deps for strict checks)..."

    AURORA_DEPS_TODO=()
    _aurora_deps_audit

    if [ "${#AURORA_DEPS_TODO[@]}" -eq 0 ]; then
        aurora_ok "All dependencies satisfied — nothing to install"
        _aurora_deps_verify
        return 0
    fi

    echo ""
    aurora_step "Dependency plan: ${#AURORA_DEPS_TODO[@]} component(s) to install: ${AURORA_DEPS_TODO[*]}"

    if [ -n "${AURORA_DEPS_DRY_RUN:-}" ]; then
        aurora_warn "AURORA_DEPS_DRY_RUN is set — reporting only, nothing was installed."
        return 0
    fi

    local mgr
    mgr="$(aurora_deps_pkg_manager || true)"
    if [ "$mgr" = "none" ] || [ -z "$mgr" ]; then
        aurora_error "No supported package manager found (apt/dnf/yum/zypper/pacman/apk)."
        _aurora_deps_verify   # prints the manual hints and fails
        aurora_fail "Automatic dependency installation is unavailable on this system."
    fi

    # Interactive confirmation only when a real terminal is attached and the
    # user did not pre-approve. Piped/non-interactive installs stay automatic.
    if [ -z "${ASSUME_YES:-}" ] && [ -t 0 ] && [ -t 1 ]; then
        printf 'Install the missing packages listed above now? [Y/n] '
        read -r _deps_answer
        case "$_deps_answer" in
            n|N|no|NO)
                aurora_error "Aborted by user. Re-run with --yes to auto-approve, or --no-deps to only check."
                aurora_fail "Missing dependencies were not installed."
                ;;
        esac
    fi

    local os_info
    os_info="$(aurora_deps_os_info)"
    local item
    for item in "${AURORA_DEPS_TODO[@]}"; do
        case "$item" in
            core)            _aurora_deps_fix_core "$mgr" ;;
            python3)         _aurora_deps_fix_python3 "$mgr" ;;
            php)             _aurora_deps_fix_php "$mgr" "$os_info" ;;
            nodejs)          _aurora_deps_fix_nodejs "$mgr" "$os_info" ;;
            yarn)            _aurora_deps_fix_yarn ;;
            mariadb-client)  _aurora_deps_fix_mariadb_client "$mgr" ;;
        esac
    done

    _aurora_deps_verify
    aurora_ok "Dependencies resolved — all required tools are available"
    return 0
}
