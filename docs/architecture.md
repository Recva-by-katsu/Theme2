# Orbit Theme Architecture

## Delivery Model

Orbit Theme is distributed as:

1. a source patch (`patches/pterodactyl-v1.15.1-orbit-theme.patch`) for existing files
2. an overlay tree (`overlay/`) for new files not present in base panel source

This keeps:

- installation deterministic
- rollback straightforward (`git apply --reverse` + overlay cleanup + backup restore)
- repository compact compared with shipping a full panel fork

## Theme Data Flow

1. `ThemeSettingsService` loads/stores `theme::configuration` in settings storage.
2. `AssetComposer` injects:
   - `panelTheme`
   - `panelThemeCssVariables`
   - `SiteConfiguration.theme`
3. Blade wrappers render CSS variables at page boot.
4. React `ThemeProvider` applies runtime tokens and mode classes.
5. Reusable UI components consume CSS variables for consistent rendering.

## Admin Settings

- Route group: `/admin/settings/theme`
- Controller: `ThemeController`
- Request validation: `ThemeSettingsFormRequest`
- View: `resources/views/admin/settings/theme.blade.php`

## Frontend Tokenization

Primary components tokenized in this release:

- Button
- Input
- Select
- Modal
- ContentBox
- SubNavigation
- Flash/Alert components
- Navigation shell

## Compatibility Contract

Patch compatibility is validated during installation with `git apply --check` against target panel source.
