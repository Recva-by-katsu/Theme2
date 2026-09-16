# Aurora Development Guide

## Setup

```bash
git clone https://github.com/Recva-by-katsu/Theme2.git
cd Theme2
```

You need a Pterodactyl 1.14.x checkout (or install) to validate against:

```bash
git clone --branch v1.14.1 --depth 1 https://github.com/pterodactyl/panel.git /tmp/panel
```

## Validation (no panel services required)

```bash
# Shell syntax
bash -n install.sh uninstall.sh update.sh scripts/*.sh

# Patch anchors + idempotency + byte-identical removal
cp -r /tmp/panel /tmp/panel-test
python3 scripts/apply-patches.py --panel-dir /tmp/panel-test --action check
python3 scripts/apply-patches.py --panel-dir /tmp/panel-test --action apply
python3 scripts/apply-patches.py --panel-dir /tmp/panel-test --action apply   # idempotent
python3 scripts/apply-patches.py --panel-dir /tmp/panel-test --action remove
diff -r /tmp/panel/app/Providers/RouteServiceProvider.php /tmp/panel-test/app/Providers/RouteServiceProvider.php

# Frontend syntax (esbuild transform, no type-check)
npx -y esbuild 'frontend/**/*.ts*' --jsx=automatic --outdir=/tmp/aurora-check --log-level=warning

# Manifest consistency (every replaced file paired + backed up)
. scripts/manifest.sh
for f in "${AURORA_REPLACED_FILES[@]}"; do aurora_manifest_pairs | grep -q "|$f$" || echo "UNPAIRED: $f"; done
```

Full type-check + build must run inside a panel checkout with dependencies:

```bash
cd /path/to/panel && yarn install && yarn tsc && yarn build:production
```

## Conventions

- **Tokens, not hex codes.** Any user-visible color/spacing/radius/shadow must
  come from `var(--aurora-*)` (CSS), the remapped Tailwind scale, or
  `useAuroraConfig()` (React). Backend-driven values go through
  `AuroraThemeService`.
- **Mirror the schema.** `AuroraThemeService::defaults()` (PHP),
  `config/theme.defaults.json`, and `frontend/aurora/defaults.ts` must stay in
  sync. Validate in both `AuroraThemeRequest` and `AuroraThemeService::sanitize()`.
- **Replacements keep APIs.** Files under `frontend/overrides/` must preserve
  the stock module's exports/props so the rest of the panel keeps working.
  Note the stock API at the top of each file.
- **Patches stay marked.** New core edits go through `apply-patches.py` with
  BEGIN/END markers and a `check`-able anchor verified against 1.14.1.
- **Manifest first.** Any new managed file must be added to `scripts/manifest.sh`
  (new path, replaced file, or tree) or the installer/uninstaller will ignore it.
- **Blade defensively.** Admin Blade must render even if the theme backend is
  missing — wrap service calls in try/catch with stock-looking fallbacks.
- **No external assets.** Fonts are system stacks + the already-bundled Plex
  Sans. No CDNs, no telemetry, no tracking pixels.

## Testing checklist (on a staging panel)

Authentication: login, logout, password reset, 2FA + recovery codes.
Dashboard: cards, search, sort, grid/list, empty state, pagination, mobile.
Server: console input + power actions, files CRUD, editor save, databases,
schedules, users, backups, network, startup, settings, activity.
Admin: every section loads; overview stats match reality; Theme Settings:
every tab saves, persists across refresh/rebuild, presets apply, logo/favicon
upload, export/import round-trip, reset works, live preview updates.
Modes: light/dark/system + user switch + `prefers-reduced-motion` + pixel on/off.

## Releasing

1. Bump `version`, `backend/config/aurora.php` (`version`), and
   `AuroraThemeService::VERSION` together.
2. Update `CHANGELOG.md`.
3. Tag `vX.Y.Z` — `update.sh --ref vX.Y.Z` consumes tags directly.
