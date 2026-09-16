# Aurora Architecture

Technical reference for how the Aurora theme integrates with Pterodactyl Panel 1.14.x & 1.15.x.

## 1. Source facts (verified, not assumed)

| Area | Finding |
|---|---|
| Panel version | 1.14.x & 1.15.x — React 16 + TS + webpack 5 + Tailwind 3 + styled-components/twin.macro |
| Build | `yarn build:production` = clean `public/assets/*.js` + `webpack --mode production` |
| Auth screens | React (`routers/AuthenticationRouter`), not Blade — Blade only bootstraps `#app` |
| User/server pages | React SPA (`resources/scripts`) |
| Admin panel | Blade + AdminLTE/Bootstrap (`resources/views/admin`, `layouts/admin.blade.php`) |
| Settings store | `settings` table via `SettingsRepository` (key/value) |
| Panel version | `config/app.php` → `'version'` (`canary` on git checkouts; releases bake it in) |
| Aliases | `@/*` → `resources/scripts/*` (webpack + tsconfig) |

## 2. Design-token flow

```
Admin → Theme Settings (Blade)
        │ PATCH /admin/aurora-theme
        ▼
AuroraThemeController → AuroraThemeRequest (validate) → AuroraThemeService (sanitize)
        │ persist aurora_theme_settings.config (JSON, cached)
        ├─► wrapper.blade.php injects window.AuroraTheme (every page, incl. login)
        └─► GET /aurora/theme.json (public, presentation-only JSON)
                          │
                          ▼
        AuroraThemeProvider (React, sync read + async revalidate)
                          │ resolve light/dark (admin default + OS + user override)
                          ▼
        cssVars.applyThemeToDocument() → :root variables + data-attributes
                          │
                          ▼
        aurora.css + tailwind remap + Aurora components → all pages
```

Single rule: **components never hardcode themeable values** — they consume
`var(--aurora-*)`, `data-aurora-*` attributes, or the remapped Tailwind scale.

## 3. How every page gets themed

1. **Tailwind color remap** (`tailwind.config.js` override). Stock components use
   `tw`/`@apply` with `gray/neutral/primary/blue/cyan/red/green/yellow/amber`
   utilities, resolved at build time. Aurora redefines those scales as
   `var(--aurora-*)` / `color-mix()` expressions, so all hashed
   styled-components and CSS modules follow the admin config at runtime —
   including dark/light mode. Verified: no other color families are used in
   stock sources.
   Every token is exposed as a Tailwind *function* color (`alphaColor()`) so
   alpha modifiers keep working: stock stylesheets contain
   `@apply bg-blue-500/75` / `text-primary-500/50`, and Tailwind can only
   resolve those by parsing the configured color. `scripts/verify-tailwind.js`
   guards the property (see TROUBLESHOOTING → build failures).
2. **Full replacements** (27 files, same module APIs): routers, navigation,
   auth screens, dashboard, server console, shared containers
   (`ContentBox`, `GreyRowBox`, `TitledGreyBox`), dialogs/menus/error screens,
   `GlobalStylesheet`, Blade layout/overview/wrapper.
3. **Surgical patches** (4 files, marked + reversible): public route
   registration, admin theme routes, `AuroraThemeProvider` wiring in `App.tsx`,
   real stats for the admin overview.
4. **New code**: `resources/scripts/aurora/*` (provider, tokens, presets,
   component library, shell), backend service/controllers/migration, admin CSS/JS.

## 4. Backend

- **Migration** `2026_01_01_000000_create_aurora_theme_settings_table.php`:
  `aurora_theme_settings(id, key unique, value longtext, timestamps)` + seeded
  default config row. `down()` drops the table.
- **Model** `AuroraThemeSetting`: thin Eloquent model for the table.
- **Service** `AuroraThemeService`: `defaults()`, `enums()`, `presets()` (7),
  `get()` (cached, deep-merged over defaults), `save()` (whitelist + sanitize),
  `applyPreset()`, `reset()`, `export()/import()`, `handleUpload()`,
  `publicConfig()`, `dashboardStats()` (real counts via Eloquent).
- **Controllers**: `Admin\AuroraThemeController` (index/update/applyPreset/
  reset/upload/export/import) and `AuroraPublicThemeController@show`.
- **Request** `AuroraThemeRequest`: root-admin authorization + full nested rules.
- **Command** `aurora:theme --verify|--reset`: ops + installer verification.
- **Routes**: `routes/aurora.php` (`GET /aurora/theme.json`, web middleware,
  guest+auth reachable) registered via a marked insertion in
  `RouteServiceProvider`; admin routes appended to `routes/admin.php`
  (inheriting `auth.session` + `RequireTwoFactorAuthentication` +
  `AdminAuthenticate`).

## 5. Frontend

- `aurora/types.ts` — config schema (mirrors PHP).
- `aurora/defaults.ts` — defaults + 7 presets + `deepMerge/withDefaults`.
- `aurora/api.ts` — sync injected read + `/aurora/theme.json` fallback.
- `aurora/cssVars.ts` — tokens → CSS vars, light-surface derivation,
  `localStorage` user override, favicon/title/theme-color sync.
- `aurora/ThemeContext.tsx` — provider (mode resolution, OS listener,
  revalidation, `preview()` API) + `useAurora()` / `useAuroraConfig()`.
- `aurora/aurora.css` — base, nav/sidebar/mobile, auth, dashboard, terminal
  chrome, forms, feedback, overlays, CodeMirror/xterm, pixel accents, page
  transitions, keyframes, reduced-motion, light-mode tuning, responsive rules.
- `aurora/components/*` — Button, Card/StatCard, forms (incl. Formik bindings +
  password visibility), feedback (Badge/Alert/EmptyState/Skeleton/loaders),
  overlays (Modal/Confirm/Drawer/Dropdown), navigation (PageHeader/Tabs/
  Breadcrumbs/SearchBox), Toast system, DataTable, brand/mode switcher.
- `aurora/layout/AuroraShell.tsx` — top bar + sidebar + mobile drawer used by
  both routers; preserves logout flow, search, admin/account links.

Untouched-by-design: WebSocket/console logic (`Console.tsx`), file/API
behaviors, permission guards, egg features — these are logic-critical and are
themed purely through tokens/CSS.

## 6. Admin (Blade)

- `layouts/admin.blade.php`: same yields/sections/vendor assets (jQuery,
  AdminLTE JS behaviors intact), new chrome, `:root` tokens from the service,
  Theme Settings nav entry, theme version in footer.
- `admin/index.blade.php`: stat cards + system info + recent servers + node
  health (all from `dashboardStats()`; Blade falls back to the service if the
  controller patch is absent — never fake data).
- `admin/aurora-theme/index.blade.php`: 9-tab settings form + sticky save bar +
  live preview + presets + import/export/reset. One form with alternate submit
  targets (JS swaps action + drops `_method` spoof for preset/import/reset).
- `public/themes/aurora/*`: `admin.css` (AdminLTE/Bootstrap reskin),
  `admin.js` (sidebar persistence, alert auto-dismiss, confirms, back-to-top),
  `theme-settings.css/js` (settings page + live preview engine).

## 7. Installer model

- `scripts/manifest.sh` is the single source of truth: new paths, replaced
  files (always backed up), patched files, package→panel mappings.
- `scripts/apply-patches.py` performs anchored, idempotent, marked insertions;
  `check` mode runs before anything is modified; `remove` restores patched
  files byte-identically (covered by automated check in CI/dev).
- `scripts/deps.sh` is the smart dependency resolver: audit (OS + package
  manager + per-tool status plan) → resolve (auto-install missing pieces via
  apt/dnf/yum/zypper/pacman/apk, NodeSource for Node.js, corepack for yarn,
  ondrej/sury PHP repos on legacy Debian/Ubuntu) → verify (fail only with
  exact manual hints). Modes: `AURORA_DEPS_MODE=auto` (default) or `off`
  (`--no-deps`, legacy strict checks); `AURORA_DEPS_DRY_RUN=1` audits without
  touching the system. A live panel's PHP is never auto-replaced.
- `install.sh`: preflight (incl. smart dependency resolution) → backup (files
  + `public/assets` + mysqldump) → maintenance → backend → patches → migrate
  → frontend/views/assets → `yarn install` + `yarn build:production` (with an
  automatic OpenSSL-legacy-provider retry for pre-OpenSSL-3 webpack) → caches
  → ownership (755/644, no 777) → verify → version record. Pipe-safe
  (self-bootstraps from GitHub, auto-installing even the download tools when
  needed). Failure trap attempts file rollback and always exits non-zero.
- `update.sh`: version-aware upgrade from any ref + `--rollback` to any backup.
- `uninstall.sh`: snapshot → remove theme → restore backup → optional
  `--remove-data` → rebuild stock → verify boot.
