# Changelog

## 1.2.1 — 2026-09-16

**Fix: the frontend build failed on a stock 1.14.x / 1.15.x panel with
``The `bg-blue-500/75` class does not exist``.**

- **Root cause.** `frontend/overrides/tailwind.config.js` remapped every color
  token to raw CSS expressions (`var(--aurora-*)`, `color-mix(...)`). Tailwind
  only resolves an alpha-modified utility such as `bg-blue-500/75` by *parsing*
  the configured color; for a `var()`/`color-mix()` string the candidate is
  dropped, so `@apply` in the stock stylesheets
  (`elements/button/style.module.css`, `elements/inputs/styles.module.css`)
  aborted the webpack build. The installer rolled the panel back, so nothing
  was left half-installed.
- **Fix.** Every token is now exposed as a Tailwind *function* color
  (`alphaColor()` helper): without an alpha modifier it returns the token
  unchanged, with one it returns
  `color-mix(in srgb, <token> <opacity>, transparent)` — `transparent` is
  premultiplied, so the result is exactly the token at that opacity. Function
  colors are Tailwind's documented pattern for CSS-variable palettes and work
  for `bg-*`, `text-*`, `border-*`, `ring-*`, `divide-*`, `shadow-*`, `fill`/
  `stroke`, and the classic `bg-opacity-*` utilities (which now actually apply).
- **New `scripts/verify-tailwind.js`** — runs the panel's own
  Tailwind/PostCSS pipeline over the alpha patterns the stock stylesheets use
  and over the stylesheets themselves, in seconds instead of a full webpack
  build: `node scripts/verify-tailwind.js --panel-dir /var/www/pterodactyl`.
  The installer (and `update.sh --rollback`) run it before every build as a
  warn-only guard.
- **Verified** with full production builds (`webpack --mode production`) of
  panel **1.15.1** (tailwind 3.4.x) and **1.14.1** (tailwind 3.0.x) checkouts
  with the theme installed, plus targeted PostCSS compiles of the two stock
  stylesheets that used to fail.
- No visual change for existing installs: tokens without an alpha modifier
  resolve to the same values as before.
- Version bump to `1.2.1` across the codebase.

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
