# Aurora Troubleshooting

## Installer

### Dependencies (smart auto-installer)

Since 1.2.0 the installer resolves missing system packages itself
(PHP CLI, python3, Node.js, yarn, curl/tar/gzip, DB client) instead of
failing with "command not found".

**Preview what would be installed (no changes):**
```bash
AURORA_DEPS_DRY_RUN=1 bash install.sh --panel-dir /var/www/pterodactyl
```

**Disable auto-install entirely (legacy strict checks):**
```bash
bash install.sh --no-deps        # or AURORA_DEPS_MODE=off
```
The installer then only verifies and fails with manual-install hints, exactly
like versions < 1.2.0.

**`No supported package manager found`** — your system lacks
apt/dnf/yum/zypper/pacman/apk. Install the tools manually (the error message
lists them), then re-run.

**Node.js install failed** — NodeSource couldn't be used (offline host,
unsupported distro, proxy). Install Node 22+ manually
(`https://nodejs.org`, distro packages, or `nvm`), or re-run with
`--skip-build` and build the frontend yourself. Override the Node line with
`AURORA_NODE_MAJOR=22` (default) if you need a different one.

**`PHP x.y is below 8.1`** — the installer never auto-replaces a live panel's
PHP. Upgrade manually (Ubuntu/Debian: `ppa:ondrej/php` / packages.sury.org;
RHEL: Remi's repo), then re-run. `--force` downgrades this to a warning.

**Dependency installs keep prompting** — pass `--yes` to auto-approve them
(piped/non-interactive runs never prompt at all).

---

**`Could not locate a Pterodactyl panel installation`**
Pass the path explicitly: `bash install.sh --panel-dir /var/www/pterodactyl`
(or set `PANEL_DIR`). The directory must contain `artisan`, `config/app.php`
and `resources/scripts`.

**`Unsupported Pterodactyl version 'x.y.z'`**
Aurora targets panel 1.14.x and 1.15.x. If you know what you're doing:
`bash install.sh --force` (anchors are still verified; mismatches abort unless
forced).

**Patch anchor mismatch**
Your panel source isn't stock (another theme or manual edits). Options:
1. Restore stock files for the 4 patched paths, then reinstall.
2. `install.sh --force` — the installer continues, but the build may fail;
   inspect `scripts/apply-patches.py` output to fix anchors manually.

**`yarn build:production` fails / runs out of memory**
Ensure Node 22+ (`node -v`) and ≥2 GB RAM — the installer auto-installs Node
unless `--no-deps` was used, and automatically retries the build with
`NODE_OPTIONS=--openssl-legacy-provider` when old webpack meets OpenSSL 3.
Manual fix:
```bash
cd /var/www/pterodactyl
rm -rf node_modules && yarn install --network-timeout 300000
yarn build:production
```
Then re-run the installer (it is idempotent and reuses backups).

**``The `bg-blue-500/75` class does not exist`` during the build**
Fixed in 1.2.1. The stock panel uses Tailwind opacity modifiers, and Aurora's
`tailwind.config.js` must expose every remapped colour as a function so
Tailwind can attach an alpha (see `withAlpha()` in
`frontend/overrides/tailwind.config.js`). If you edit that file, keep new
colour scales wrapped in `alphaScale()`; the smoke check in
`docs/DEVELOPMENT.md` catches regressions without a full build.

**`mysqldump not found`**
The installer auto-installs the DB client (unless `--no-deps`); if it was
skipped or failed, install it manually (`mariadb-client`/`mysql-client`) for
automatic DB backups, or back up manually before installing.

**Permission errors after install**
```bash
cd /var/www/pterodactyl
chown -R www-data:www-data .
php artisan view:clear && php artisan config:clear && php artisan route:clear
```
(Replace `www-data` with your web user; the installer auto-detects it.)

## Runtime

**Pages unstyled / old UI after install**
Hard-refresh (Ctrl+Shift+R). Verify the build output is fresh:
`ls -la public/assets/manifest.json`. If a CDN/proxy caches aggressively, purge
it. Check the browser console for bundle 404s.

**Theme Settings page 404s**
Routes didn't register: `php artisan route:list --name=admin.aurora-theme`.
If empty, check `routes/admin.php` ends with the aurora block and run
`php artisan route:clear`.

**Settings don't persist / show defaults**
Run `php artisan aurora:theme --verify`. Check `storage/logs/laravel.log`.
Ensure the `aurora_theme_settings` table exists
(`php artisan migrate:status | grep -i aurora`).

**Login page not themed**
`resources/views/templates/wrapper.blade.php` must be the Aurora version and
views recompiled: `php artisan view:clear`. The page needs
`window.AuroraTheme` — view-source to confirm the injection block exists.

**Light mode looks wrong on one component**
Report it with the component name + screenshot. Workaround: switch appearance
mode to dark/system until fixed.

**`prefers-reduced-motion` users still see motion**
File a bug — this is a release-blocking guarantee. All keyframes and page
transitions are gated behind both the admin toggle and the media query.

## Recovery

- Every install/update/uninstall creates restorable backups in
  `/var/backups/aurora-theme/<timestamp>/` with `MANIFEST.tsv` + `META.env`.
- `bash update.sh --rollback` restores files and rebuilds.
- `bash uninstall.sh` restores stock completely (keeps theme data unless
  `--remove-data`).
- If the panel shows a 500: `php artisan up`, clear all caches, inspect
  `storage/logs/laravel.log`, and restore from backup if needed.
