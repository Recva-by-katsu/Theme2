# Orbit Theme for Pterodactyl Panel (v1.15.1)

Orbit Theme is a deep customization layer for **Pterodactyl Panel 1.15.1** delivered as a production installer package.

- centralized design-token system (colors, typography, radius, animations, pixel accents)
- redesigned auth, dashboard, navigation, server overview/console, and admin styling
- real **Admin → Settings → Theme** backend-powered settings page
- installer/update/uninstall/rollback scripts with backups

> Theme version: **1.1.0**

---

## Supported Version

- ✅ Pterodactyl Panel **1.15.1** (primary target)
- Installer validates patch compatibility before applying changes.

---

## Repository Structure

```text
.
├── README.md
├── LICENSE
├── version
├── install.sh
├── update.sh
├── uninstall.sh
├── scripts/
│   └── common.sh
├── patches/
│   └── pterodactyl-v1.15.1-orbit-theme.patch
├── overlay/
│   └── ... (new files not present in base panel source)
├── config/
│   ├── default-theme.json
│   ├── manifest-files.txt
│   └── overlay-files.txt
└── docs/
    ├── architecture.md
    └── troubleshooting.md
```

---

## Requirements

- `bash`, `git`, `curl`
- `php` (for artisan migrate/cache commands)
- Node toolchain compatible with Panel 1.15.1 (Node >=22, yarn recommended)
- root privileges (`sudo`)

---

## Installation

### One-command install

```bash
wget -qO- https://raw.githubusercontent.com/Recva-by-katsu/Theme2/main/install.sh | bash
```

or

```bash
curl -fsSL https://raw.githubusercontent.com/Recva-by-katsu/Theme2/main/install.sh | bash
```

### Local install

```bash
sudo bash install.sh --panel-dir /var/www/pterodactyl
```

Optional flags:
- `--force`
- `--skip-build`

---

## Update

```bash
sudo bash update.sh --panel-dir /var/www/pterodactyl
```

Optional flags:
- `--force`
- `--skip-build`

---

## Uninstall

```bash
sudo bash uninstall.sh --panel-dir /var/www/pterodactyl
```

Optional flags:
- `--backup-dir /var/backups/pterodactyl-theme/<timestamp>`
- `--force`
- `--skip-build`

---

## Rollback

```bash
sudo bash update.sh --panel-dir /var/www/pterodactyl --rollback
```

Alternative:

```bash
sudo bash uninstall.sh --panel-dir /var/www/pterodactyl --backup-dir /var/backups/pterodactyl-theme/<timestamp>
```

---

## Theme Settings Location

After install:

- **Admin → Settings → Theme**

Includes configurable presets and controls for brand, colors, appearance, typography, login page, animations, and pixel accents.

---

## Backup Behavior

Backups are stored in:

```text
/var/backups/pterodactyl-theme/
```

Each backup includes:
- patched-file snapshot (`config/manifest-files.txt`)
- overlay-file snapshot (`config/overlay-files.txt`)
- patch copy used during install
- `.env` backup (when present)

---

## Verification

Validated against clean Pterodactyl **v1.15.1** source:

- `yarn tsc` ✅
- `yarn lint` ✅
- installer smoke tests (`install.sh`, `update.sh`, `uninstall.sh`, `update.sh --rollback`) ✅

---

## Known Limitations

- Targeted to Pterodactyl 1.15.1 source layout.
- Heavily customized forks may require manual patch conflict resolution.

---

## License

MIT (see `LICENSE`)
