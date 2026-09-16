<?php

/*
|--------------------------------------------------------------------------
| Aurora Theme Configuration
|--------------------------------------------------------------------------
|
| Static (code-level) configuration for the Aurora theme. The editable theme
| settings live in the `aurora_theme_settings` database table and are managed
| through Admin → Theme Settings. Values below are operational knobs that
| intentionally require file access to change.
|
*/

return [
    // Theme version — kept in sync with the repository `version` file.
    'version' => '1.2.0',

    // Cache (seconds) for the resolved theme config. Cleared on every save.
    'cache_ttl' => (int) env('AURORA_THEME_CACHE', 300),

    // Public disk path (relative to public/) for uploaded brand assets.
    'upload_dir' => 'themes/aurora/uploads',

    // Maximum upload size (kilobytes) for logo / favicon files.
    'upload_max_kb' => 2048,
];
