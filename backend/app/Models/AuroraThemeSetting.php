<?php

namespace Pterodactyl\Models;

/**
 * Pterodactyl\Models\AuroraThemeSetting.
 *
 * Simple key/value store backing the Aurora theme configuration.
 * The whole theme config lives in a single JSON row (key = "config").
 *
 * @property int $id
 * @property string $key
 * @property string|null $value
 */
class AuroraThemeSetting extends Model
{
    protected $table = 'aurora_theme_settings';

    protected $fillable = ['key', 'value'];
}
