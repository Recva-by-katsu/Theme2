# Changelog

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
