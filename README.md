# Aurora Theme for Pterodactyl Panel

A complete, production-quality UI/UX redesign for **Pterodactyl Panel 1.14.x** —
not a CSS skin. Aurora replaces the navigation, authentication screens, dashboard,
server console and admin area with a modern SaaS-style interface, and adds a real
**Admin → Theme Settings** system (colors, modes, animations, pixel accents,
typography, login page, presets, live preview) backed by the database.

- **Design language:** modern SaaS dashboard + premium hosting panel + subtle
  iOS influences + optional tasteful pixel accents.
- **Dark / light / system modes** with per-user switching, `prefers-reduced-motion`
  support, responsive mobile layouts, and accessible components throughout.
- **Safe automation:** one-command installer with backups, maintenance mode,
  migrations, frontend build, verification and rollback — plus updater and
  uninstaller.

> Target: **Pterodactyl Panel 1.14.x** (verified against 1.14.1).
> Theme version: **1.0.0**

---

## Screenshots

> Screenshots will be added after the first release install. Placeholders:

| Area | Preview |
|---|---|
| Login | `docs/screenshots/login.png` (placeholder) |
| Dashboard | `docs/screenshots/dashboard.png` (placeholder) |
| Server console | `docs/screenshots/console.png` (placeholder) |
| Theme Settings | `docs/screenshots/theme-settings.png` (placeholder) |
| Admin overview | `docs/screenshots/admin.png` (placeholder) |

---

## What's redesigned

**User panel (React + design tokens)**
- Authentication: login, forgot/reset password, 2FA checkpoint, validation,
  loading and error states, password visibility toggles, themed backgrounds.
- Navigation: sticky glass top bar, floating/fixed sidebar, mobile slide-over
  menu, global search, account menu, light/dark/system switcher.
- Dashboard: server cards (status, CPU/RAM/disk, address), grid/list layouts,
  server-side search, sorting, skeletons, empty states, pagination.
- Server console: terminal window chrome, connection indicator, power controls,
  live stat tiles, resource graphs, install/transfer/maintenance warnings.
- Every other server page (files, editor, databases, schedules, users, backups,
  network, startup, settings, activity) and account page inherits the design
  system: themed containers, buttons, inputs, dialogs, toasts, tables,
  CodeMirror and xterm styling.
- Error/empty/loading/disconnected states throughout.

**Admin panel (Blade + reskin)**
- New admin chrome (header, sidebar, footer) following the live theme colors.
- Overview dashboard with **real** statistics: users, servers, nodes, locations,
  databases, allocations, recent servers, node health.
- Every stock admin page (users, servers, nodes, locations, nests, eggs, mounts,
  databases, API, settings) is reskinned via the theme tokens.
- **Admin → Theme Settings**: the full customization UI with live preview.

**Theme engine**
- Central `AuroraThemeService` + `aurora_theme_settings` DB table (cached,
  validated, sanitized, import/export, reset, 7 built-in presets).
- Public config at `/aurora/theme.json` + server-side injection into every page
  (no theme flash, works for guests on the login screen).
- React `AuroraThemeProvider` → CSS variables → reusable component library.

---

## Requirements

- Pterodactyl Panel **1.14.x** (installer verifies; `--force` overrides)
- Root access on the panel host
- PHP 8.2+ (same binary the panel uses), `python3`
- Node.js 22+ and `yarn` (for the frontend build; or `--skip-build`)
- `curl` or `wget`, `tar`, `gzip`
- `mysqldump` recommended (automatic database backup; skipped with a warning if absent)

---

## Installation

One-command install (downloads this repository and runs the installer):

```bash
curl -fsSL https://raw.githubusercontent.com/Recva-by-katsu/Theme2/main/install.sh | bash
```

```bash
wget -qO- https://raw.githubusercontent.com/Recva-by-katsu/Theme2/main/install.sh | bash
```

From a clone:

```bash
git clone https://github.com/Recva-by-katsu/Theme2.git
cd Theme2
bash install.sh --panel-dir /var/www/pterodactyl
```

Useful options:

```bash
bash install.sh --panel-dir /var/www/pterodactyl --yes --verbose
bash install.sh --force            # bypass version/support checks (risky)
bash install.sh --skip-build       # skip yarn install + webpack build
bash install.sh --no-maintenance   # do not enable maintenance mode
AURORA_REPO=MyOrg/MyFork AURORA_REF=dev bash install.sh   # install a fork/ref
```

What the installer does:

1. Detects OS, verifies root, locates the panel (`--panel-dir` or auto-detect)
2. Detects the panel version and checks 1.14.x support
3. Verifies dependencies and patch anchors **before touching anything**
4. Backs up every modified file + compiled assets + database dump to
   `/var/backups/aurora-theme/<timestamp>/`
5. Enables maintenance mode, installs backend/frontend/admin files
6. Applies small marked patches (routes, theme provider, admin stats)
7. Runs migrations (`aurora_theme_settings` table + defaults)
8. Builds the frontend (`yarn install` + `yarn build:production`)
9. Clears caches, fixes ownership (never 777), disables maintenance mode
10. Verifies routes, files and config — and rolls back on failure

After installing, open **Admin → Theme Settings** (`/admin/aurora-theme`).

---

## Update

```bash
cd Theme2 && git pull
bash update.sh --panel-dir /var/www/pterodactyl
```

Or update directly to a branch/tag without cloning:

```bash
bash update.sh --ref main --panel-dir /var/www/pterodactyl
```

The updater downloads the requested ref, compares versions, creates a fresh
backup, and re-runs the installer idempotently.

## Rollback

Restore the newest backup (files + rebuild + caches):

```bash
bash update.sh --rollback --panel-dir /var/www/pterodactyl
bash update.sh --rollback --backup /var/backups/aurora-theme/<timestamp>
```

The database is **never** auto-restored. If you need the pre-install database:

```bash
gunzip -c /var/backups/aurora-theme/<timestamp>/database/*.sql.gz | mysql -u <user> -p <database>
```

## Uninstall

```bash
bash uninstall.sh --panel-dir /var/www/pterodactyl
```

- Removes all theme files, reverses patches, restores stock files from backup
- Rebuilds the stock frontend, clears caches, restores ownership
- **Keeps** theme settings data by default; add `--remove-data` to drop the
  `aurora_theme_settings` table and uploaded assets too
- Never touches unrelated panel data (servers, users, nodes, eggs…)

---

## Theme Settings

Location: **Admin → Theme Settings** (`/admin/aurora-theme`). Everything saves to
the database, is cached, survives rebuilds/restarts, and applies instantly.

| Tab | Controls |
|---|---|
| General | Brand name/description, logo + favicon (URL or upload), footer text |
| Colors | 13 tokens: primary → info, surfaces, text, borders |
| Appearance | Light/dark/system, user switching, sidebar style/collapse, compact/dense, card layout, radius (0–24), shadows |
| Animations | Master switch, intensity, page/hover/button/modal/background effects, loading style (skeleton/spinner/dots) |
| Pixel | Pixel style on/off, intensity, decorations, pixelated icons |
| Typography | Font stack (local only), base size, heading scale, weight, line height |
| Login | Title/subtitle, logo, background (mesh/gradient/grid/plain), card (glass/solid/outline), artwork panel |
| Presets | Playful, Modern, Premium, iOS Inspired, Pixel, Midnight, Minimal |
| Backup | Export/import JSON, reset to defaults |

Plus a **live preview** that updates as you type — no reload, no save required
to see changes. Users who set `prefers-reduced-motion` always get a static UI.

CLI helpers:

```bash
php artisan aurora:theme --verify        # check table, config, routes
php artisan aurora:theme --reset --force # reset config to defaults
```

Public (unauthenticated, presentation-only) config: `GET /aurora/theme.json`

---

## Repository structure

```
├── install.sh / update.sh / uninstall.sh   # automation (+ rollback)
├── version, LICENSE, README.md
├── config/theme.defaults.json              # canonical default tokens
├── scripts/
│   ├── lib.sh            # logging, detection, backup, permissions
│   ├── manifest.sh       # single source of truth for managed files
│   └── apply-patches.py  # surgical, reversible core patches
├── backend/
│   ├── app/Models/AuroraThemeSetting.php
│   ├── app/Services/AuroraThemeService.php # defaults, presets, sanitize, stats
│   ├── app/Http/Controllers/Admin/AuroraThemeController.php
│   ├── app/Http/Controllers/AuroraPublicThemeController.php
│   ├── app/Http/Requests/Admin/AuroraThemeRequest.php
│   ├── app/Console/Commands/AuroraThemeCommand.php
│   ├── database/migrations/*_create_aurora_theme_settings_table.php
│   ├── routes/aurora.php
│   └── config/aurora.php
├── frontend/
│   ├── aurora/           # theme core: types, defaults, presets, provider,
│   │                     # cssVars, api, aurora.css, components/*, layout/*
│   └── overrides/        # panel-path-mirrored replacements (tailwind config,
│                         # GlobalStylesheet, routers, auth, dashboard, console…)
├── admin/views/          # Blade: admin layout, overview, theme settings page,
│                         # React wrapper (theme injection)
├── public/aurora/        # admin.css, admin.js, theme-settings.css/js
└── docs/                 # architecture, development, troubleshooting
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full technical breakdown.

---

## Troubleshooting

**Install fails on patch anchors** — your panel source differs from stock 1.14.1
(another theme/modification). Restore stock files or re-run with `--force`.

**Build fails (`yarn build:production`)** — ensure Node 22+ and enough RAM
(≥2 GB recommended). Re-run; the installer reuses backups and is idempotent.
You can also build manually: `cd /var/www/pterodactyl && yarn install && yarn build:production`.

**Pages look unstyled after install** — hard-refresh (Ctrl+Shift+R); the bundle
filename changes on rebuild but aggressive caching/proxies may hold the old one.
Check `public/assets/manifest.json` is fresh.

**Theme Settings shows defaults after save** — check `storage/logs/laravel.log`
for DB errors and run `php artisan aurora:theme --verify`. Config cache is
cleared automatically on save.

**Login page not themed** — the wrapper injects `window.AuroraTheme`; verify
`resources/views/templates/wrapper.blade.php` is the Aurora version and run
`php artisan view:clear`.

More: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

---

## Development

```bash
# Validate shell + patch engine (no panel needed)
bash -n install.sh uninstall.sh update.sh scripts/*.sh
python3 scripts/apply-patches.py --help

# Validate against a panel checkout
python3 scripts/apply-patches.py --panel-dir /path/to/panel --action check

# Type-check the frontend (inside a panel checkout with node_modules)
yarn tsc
```

Guidelines in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). The design-token flow is
`AuroraThemeService → Blade/JSON → AuroraThemeProvider → CSS variables →
components`; never hardcode themeable values in components.

---

## Security

- No telemetry, no external requests (except the stock admin CDN assets the
  panel already loads), no credentials handling beyond stock flows.
- Theme settings endpoints require root admin (`AdminAuthenticate` + FormRequest
  check); the public endpoint exposes presentation settings only.
- Uploads are restricted to image types, size-limited, stored under
  `public/themes/aurora/uploads/` with randomized names.
- Auth, CSRF, sessions, permissions and API guards are untouched.

## Credits

- Built for [Pterodactyl Panel](https://github.com/pterodactyl/panel) 1.14.x.
- Implementation techniques studied from the official panel source and the
  open-source theme community (see docs). All Aurora code, design and assets
  are original.

## License

MIT — see [LICENSE](LICENSE).
