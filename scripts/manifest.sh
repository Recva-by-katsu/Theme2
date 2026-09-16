#!/usr/bin/env bash
#
# Aurora Theme — file manifest.
# Single source of truth for which panel paths the theme creates, replaces,
# or patches. Used by install.sh / update.sh / uninstall.sh and verify.
#
# shellcheck disable=SC2034

# New files/directories created by the theme (safe to delete on uninstall).
# Suffix ":tree" marks a whole directory.
AURORA_NEW_PATHS=(
    "app/Models/AuroraThemeSetting.php"
    "app/Services/AuroraThemeService.php"
    "app/Http/Controllers/Admin/AuroraThemeController.php"
    "app/Http/Controllers/AuroraPublicThemeController.php"
    "app/Http/Requests/Admin/AuroraThemeRequest.php"
    "app/Console/Commands/AuroraThemeCommand.php"
    "database/migrations/2026_01_01_000000_create_aurora_theme_settings_table.php"
    "routes/aurora.php"
    "config/aurora.php"
    "resources/scripts/aurora:tree"
    "resources/views/admin/aurora-theme:tree"
    "public/themes/aurora:tree"
)

# Existing panel files that the theme replaces wholesale.
# These are ALWAYS backed up before being overwritten, and restored on uninstall.
AURORA_REPLACED_FILES=(
    "tailwind.config.js"
    "resources/scripts/assets/css/GlobalStylesheet.ts"
    "resources/scripts/components/NavigationBar.tsx"
    "resources/scripts/components/auth/LoginContainer.tsx"
    "resources/scripts/components/auth/LoginFormContainer.tsx"
    "resources/scripts/components/auth/LoginCheckpointContainer.tsx"
    "resources/scripts/components/auth/ForgotPasswordContainer.tsx"
    "resources/scripts/components/auth/ResetPasswordContainer.tsx"
    "resources/scripts/routers/AuthenticationRouter.tsx"
    "resources/scripts/components/dashboard/DashboardContainer.tsx"
    "resources/scripts/components/dashboard/ServerRow.tsx"
    "resources/scripts/components/server/console/ServerConsoleContainer.tsx"
    "resources/scripts/components/server/console/StatBlock.tsx"
    "resources/scripts/components/server/console/ServerDetailsBlock.tsx"
    "resources/scripts/components/server/console/PowerButtons.tsx"
    "resources/scripts/routers/DashboardRouter.tsx"
    "resources/scripts/routers/ServerRouter.tsx"
    "resources/scripts/components/elements/SubNavigation.tsx"
    "resources/scripts/components/elements/ContentContainer.tsx"
    "resources/scripts/components/elements/ScreenBlock.tsx"
    "resources/scripts/components/elements/DropdownMenu.tsx"
    "resources/scripts/components/elements/GreyRowBox.tsx"
    "resources/scripts/components/elements/TitledGreyBox.tsx"
    "resources/scripts/components/elements/ContentBox.tsx"
    "resources/views/layouts/admin.blade.php"
    "resources/views/admin/index.blade.php"
    "resources/views/templates/wrapper.blade.php"
)

# Existing panel files modified via small marked insertions (see apply-patches.py).
# Also backed up before modification.
AURORA_PATCHED_FILES=(
    "app/Providers/RouteServiceProvider.php"
    "routes/admin.php"
    "resources/scripts/components/App.tsx"
    "app/Http/Controllers/Admin/BaseController.php"
)

# Map of theme-package source -> panel destination for one-to-one file installs.
# Format: "package/rel/path|panel/rel/path". Directories are handled separately.
aurora_manifest_pairs() {
    cat <<'MANIFEST'
backend/app/Models/AuroraThemeSetting.php|app/Models/AuroraThemeSetting.php
backend/app/Services/AuroraThemeService.php|app/Services/AuroraThemeService.php
backend/app/Http/Controllers/Admin/AuroraThemeController.php|app/Http/Controllers/Admin/AuroraThemeController.php
backend/app/Http/Controllers/AuroraPublicThemeController.php|app/Http/Controllers/AuroraPublicThemeController.php
backend/app/Http/Requests/Admin/AuroraThemeRequest.php|app/Http/Requests/Admin/AuroraThemeRequest.php
backend/app/Console/Commands/AuroraThemeCommand.php|app/Console/Commands/AuroraThemeCommand.php
backend/database/migrations/2026_01_01_000000_create_aurora_theme_settings_table.php|database/migrations/2026_01_01_000000_create_aurora_theme_settings_table.php
backend/routes/aurora.php|routes/aurora.php
backend/config/aurora.php|config/aurora.php
frontend/overrides/tailwind.config.js|tailwind.config.js
frontend/overrides/resources/scripts/assets/css/GlobalStylesheet.ts|resources/scripts/assets/css/GlobalStylesheet.ts
frontend/overrides/resources/scripts/components/NavigationBar.tsx|resources/scripts/components/NavigationBar.tsx
frontend/overrides/resources/scripts/components/auth/LoginContainer.tsx|resources/scripts/components/auth/LoginContainer.tsx
frontend/overrides/resources/scripts/components/auth/LoginFormContainer.tsx|resources/scripts/components/auth/LoginFormContainer.tsx
frontend/overrides/resources/scripts/components/auth/LoginCheckpointContainer.tsx|resources/scripts/components/auth/LoginCheckpointContainer.tsx
frontend/overrides/resources/scripts/components/auth/ForgotPasswordContainer.tsx|resources/scripts/components/auth/ForgotPasswordContainer.tsx
frontend/overrides/resources/scripts/components/auth/ResetPasswordContainer.tsx|resources/scripts/components/auth/ResetPasswordContainer.tsx
frontend/overrides/resources/scripts/routers/AuthenticationRouter.tsx|resources/scripts/routers/AuthenticationRouter.tsx
frontend/overrides/resources/scripts/components/dashboard/DashboardContainer.tsx|resources/scripts/components/dashboard/DashboardContainer.tsx
frontend/overrides/resources/scripts/components/dashboard/ServerRow.tsx|resources/scripts/components/dashboard/ServerRow.tsx
frontend/overrides/resources/scripts/components/server/console/ServerConsoleContainer.tsx|resources/scripts/components/server/console/ServerConsoleContainer.tsx
frontend/overrides/resources/scripts/components/server/console/StatBlock.tsx|resources/scripts/components/server/console/StatBlock.tsx
frontend/overrides/resources/scripts/components/server/console/ServerDetailsBlock.tsx|resources/scripts/components/server/console/ServerDetailsBlock.tsx
frontend/overrides/resources/scripts/components/server/console/PowerButtons.tsx|resources/scripts/components/server/console/PowerButtons.tsx
frontend/overrides/resources/scripts/routers/DashboardRouter.tsx|resources/scripts/routers/DashboardRouter.tsx
frontend/overrides/resources/scripts/routers/ServerRouter.tsx|resources/scripts/routers/ServerRouter.tsx
frontend/overrides/resources/scripts/components/elements/SubNavigation.tsx|resources/scripts/components/elements/SubNavigation.tsx
frontend/overrides/resources/scripts/components/elements/ContentContainer.tsx|resources/scripts/components/elements/ContentContainer.tsx
frontend/overrides/resources/scripts/components/elements/ScreenBlock.tsx|resources/scripts/components/elements/ScreenBlock.tsx
frontend/overrides/resources/scripts/components/elements/DropdownMenu.tsx|resources/scripts/components/elements/DropdownMenu.tsx
frontend/overrides/resources/scripts/components/elements/GreyRowBox.tsx|resources/scripts/components/elements/GreyRowBox.tsx
frontend/overrides/resources/scripts/components/elements/TitledGreyBox.tsx|resources/scripts/components/elements/TitledGreyBox.tsx
frontend/overrides/resources/scripts/components/elements/ContentBox.tsx|resources/scripts/components/elements/ContentBox.tsx
admin/views/layouts/admin.blade.php|resources/views/layouts/admin.blade.php
admin/views/admin/index.blade.php|resources/views/admin/index.blade.php
admin/views/templates/wrapper.blade.php|resources/views/templates/wrapper.blade.php
MANIFEST
}

# Map of theme-package source dir -> panel destination dir for tree installs.
aurora_manifest_trees() {
    cat <<'MANIFEST'
frontend/aurora|resources/scripts/aurora
admin/views/admin/aurora-theme|resources/views/admin/aurora-theme
public/aurora|public/themes/aurora
MANIFEST
}
