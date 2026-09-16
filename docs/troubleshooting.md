# Troubleshooting

## Installer says patch compatibility failed

- Ensure panel source is exactly Pterodactyl 1.15.1 (or a close, unmodified tree).
- Retry with a clean checkout.
- Use `--force` only when you understand the local divergences.

## Frontend did not change after install

- Rebuild assets manually:
  - `yarn install`
  - `yarn build:production`
- Clear cache:
  - `php artisan optimize:clear`
- Hard refresh browser cache.

## Theme settings page missing

- Confirm route registration in `routes/admin.php` includes `/admin/settings/theme`.
- Confirm patch applied successfully (installer output includes `[OK] Patch applied successfully`).

## Rollback needed

- Preferred: `sudo bash update.sh --panel-dir /var/www/pterodactyl --rollback`
- Alternative: `sudo bash uninstall.sh --panel-dir /var/www/pterodactyl --backup-dir <backup_path>`

## Build fails because tooling is missing

Install required host tooling:

- PHP + required panel extensions
- Node + yarn compatible with your panel release
- git and curl
