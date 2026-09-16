# Changelog

## 1.2.1 — 2026-09-16

Fixes the frontend build failing on every install (1.14.x and 1.15.x) and
the resulting rollback.

- **Fix `yarn build:production` error** ``The `bg-blue-500/75` class does not
  exist`` (and `text-primary-500/50`). The stock panel uses Tailwind opacity
  modifiers (`bg-blue-500/75`, `bg-gray-900/50`, `ring-opacity-50`, …) which
  Tailwind 3 can only generate when a colour can take an alpha channel. The
  Aurora `tailwind.config.js` remaps colours to `var(--aurora-*)` /
  `color-mix()` strings, which Tailwind cannot parse, so those utilities were
  silently dropped and `@apply` in `button/style.module.css` and
  `inputs/styles.module.css` failed. Every remapped colour step is now a
  Tailwind colour function that layers the requested alpha with a second
  `color-mix(... , transparent)`, so `bg-blue-500/75`, `*-opacity-*` and
  twin.macro `theme('colors.*')` all resolve while still following the
  admin-configured palette in dark and light mode.

## 1.2.0 — 2026-09-16

Smart installer: the installer now **detects and auto-installs** every system
dependency instead of failing when something is missing.

- **New `scripts/deps.sh`** — dependency resolver with three phases:
  1. *Audit*: detects the OS, package manager (apt, dnf, yum, zypper, pacman,
     apk) and every tool the theme needs (PHP CLI, python3, Node.js, yarn,
     curl/tar/gzip, mysqldump), then prints a per-tool status plan.
  2. *Resolve*: installs whatever is missing — Node.js via the official
     NodeSource repositories (configurable: `AURORA_NODE_MAJOR`, default 22),
     yarn via corepack/npm, modern PHP via ppa:ondrej/php / packages.sury.org
     on legacy Debian/Ubuntu, plus the DB client for automatic backups.
  3. *Verify*: re-checks everything afterward and only fails with exact,
     distro-specific manual instructions when auto-install truly cannot help.
- **Version awareness**: existing Node.js is kept when usable
  (`AURORA_NODE_MIN_MAJOR=16` hard floor, 22+ recommended); PHP < 8.1 is never
  auto-replaced on a live panel host (clear manual-upgrade guidance instead).
- **`--no-deps` / `AURORA_DEPS_MODE=off`**: restores the legacy strict
  behaviour (fail fast with manual hints) — nothing changes for managed/CI
  environments that forbid system mutations.
- **`AURORA_DEPS_DRY_RUN=1`**: prints the audit + install plan without
  changing the system.
- **Pipe-safe bootstrap**: even `curl | bash` on barebones images now
  self-installs curl/wget/tar/gzip before downloading the theme package.
- **Smarter frontend build**: `yarn build:production` automatically retries
  once with `NODE_OPTIONS=--openssl-legacy-provider` when the panel's webpack
  toolchain predates OpenSSL 3 (Node 17+) — the most common build failure.
- **Interactive safety**: when run on a TTY without `--yes`, the planned
  package installs are confirmed once (`[Y/n]`); piped/non-interactive runs
  stay fully automatic.
- `update.sh` gained `--no-deps` and passes it through to the installer.
- Version bump to `1.2.0` across codebase (`version`, `AuroraThemeService::VERSION`,
  `config/aurora.php`, `admin.blade.php`, `scripts/lib.sh`).

## 1.1.0 — 2026-09-16

Added official support for Pterodactyl Panel 1.15.x alongside 1.14.x.

- **Panel compatibility**: Expanded official support to include Pterodactyl Panel 1.15.x.
- **Version checking**: Updated version verification in `scripts/lib.sh` and `install.sh` to use `AURORA_SUPPORTED_PANELS` list with default `"1.14 1.15"`. Backward compatibility for legacy single-panel override `AURORA_SUPPORTED_PANEL` is maintained.
- **Documentation**: Updated all references across `README.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, and `docs/TROUBLESHOOTING.md` to reflect 1.14.x and 1.15.x support.
- **Version bump**: Bumped Aurora Theme version to `1.1.0` across codebase (`version`, `AuroraThemeService::VERSION`, `config/aurora.php`, `admin.blade.php`, `scripts/lib.sh`).

## 1.0.0 — 2026-09-16

Initial release of the Aurora Theme for Pterodactyl Panel 1.14.x.

**Theme engine**
- Central `AuroraThemeService` with defaults, validation, sanitization, caching
- `aurora_theme_settings` database table + migration with seeded defaults
- 7 built-in presets (Playful, Modern, Premium, iOS Inspired, Pixel, Midnight, Minimal)
- Import/export/reset, logo + favicon uploads
- Public `/aurora/theme.json` endpoint + server-side injection (no theme flash)
- React `AuroraThemeProvider` with light/dark/system + user override + live preview API
- Design-token system: CSS variables + remapped Tailwind scale + `aurora.css`

**Redesigned interfaces**
- Authentication (login, forgot/reset password, 2FA checkpoint)
- Top bar + sidebar + mobile navigation + pill sub-navigation
- Dashboard (server cards, search, sort, grid/list, skeletons, empty states)
- Server console (terminal chrome, connection indicator, power controls, stat tiles)
- Shared containers powering files, databases, schedules, users, backups, network, startup, settings, account pages
- Error/404 screens, modals, toasts, tables, forms, CodeMirror + xterm styling
- Admin chrome, overview dashboard with real statistics, all admin sections reskinned
- Admin → Theme Settings: 9 tabs + live preview

**Automation**
- `install.sh`: detection, backups, maintenance, migrations, build, verify, rollback
- `update.sh`: version-aware upgrades + `--rollback`
- `uninstall.sh`: full stock restore (+ optional `--remove-data`)
- Reversible surgical patch engine with byte-identical removal
