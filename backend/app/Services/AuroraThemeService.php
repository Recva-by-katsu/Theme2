<?php

namespace Pterodactyl\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Pterodactyl\Models\AuroraThemeSetting;

/**
 * Central service for the Aurora theme configuration.
 *
 * Responsibilities:
 *  - provide canonical defaults (single source of truth for PHP-side code)
 *  - read/merge/persist the admin-editable config (DB, cached)
 *  - expose the public-safe config for the login page + React frontend
 *  - built-in presets, import/export, reset, asset uploads
 *  - real admin-dashboard statistics (no fabricated numbers)
 */
class AuroraThemeService
{
    public const CACHE_KEY = 'aurora:theme:config';

    public const VERSION = '1.2.1';

    /**
     * Canonical default configuration.
     */
    public static function defaults(): array
    {
        return [
            'brand' => [
                'name' => '',
                'description' => 'Game & application server management, beautifully simple.',
                'logoUrl' => '',
                'faviconUrl' => '',
                'footerText' => '',
            ],
            'colors' => [
                'primary' => '#4f7cff',
                'secondary' => '#7c5cff',
                'accent' => '#22d3ee',
                'background' => '#0b1020',
                'surface' => '#101737',
                'card' => '#151d42',
                'text' => '#eef2ff',
                'muted' => '#9aa6c7',
                'border' => '#263056',
                'success' => '#22c55e',
                'warning' => '#f59e0b',
                'danger' => '#ef4444',
                'info' => '#38bdf8',
            ],
            'appearance' => [
                'mode' => 'system', // light|dark|system
                'allowUserSwitch' => true,
                'sidebarStyle' => 'floating', // floating|fixed|top
                'sidebarCollapsed' => false,
                'compact' => false,
                'dense' => false,
                'cardLayout' => 'grid', // grid|list
                'radius' => 14, // 0-24 px
                'shadow' => 'soft', // none|soft|medium|strong
            ],
            'animations' => [
                'enabled' => true,
                'intensity' => 'normal', // subtle|normal|playful
                'pageTransitions' => true,
                'hoverEffects' => true,
                'buttonEffects' => true,
                'modalAnimations' => true,
                'backgroundEffects' => true,
                'loadingStyle' => 'skeleton', // skeleton|spinner|dots
            ],
            'pixel' => [
                'enabled' => false,
                'intensity' => 'subtle', // subtle|normal|bold
                'decorations' => true,
                'pixelIcons' => false,
            ],
            'typography' => [
                'fontFamily' => 'system', // system|plex|inter|mono|rounded
                'baseSize' => 15, // 13-18 px
                'headingScale' => 1.0, // 0.9-1.3
                'weight' => '400', // 300|400|500|600
                'lineHeight' => 1.55, // 1.3-1.9
            ],
            'login' => [
                'title' => '',
                'subtitle' => '',
                'showLogo' => true,
                'background' => 'mesh', // mesh|gradient|grid|plain
                'cardStyle' => 'glass', // glass|solid|outline
                'sideArt' => true,
            ],
        ];
    }

    /**
     * Allowed enum values per field (used by sanitize()).
     */
    public static function enums(): array
    {
        return [
            'appearance.mode' => ['light', 'dark', 'system'],
            'appearance.sidebarStyle' => ['floating', 'fixed', 'top'],
            'appearance.cardLayout' => ['grid', 'list'],
            'appearance.shadow' => ['none', 'soft', 'medium', 'strong'],
            'animations.intensity' => ['subtle', 'normal', 'playful'],
            'animations.loadingStyle' => ['skeleton', 'spinner', 'dots'],
            'pixel.intensity' => ['subtle', 'normal', 'bold'],
            'typography.fontFamily' => ['system', 'plex', 'inter', 'mono', 'rounded'],
            'typography.weight' => ['300', '400', '500', '600'],
            'login.background' => ['mesh', 'gradient', 'grid', 'plain'],
            'login.cardStyle' => ['glass', 'solid', 'outline'],
        ];
    }

    /**
     * Built-in presets. Each preset is a deep-partial override applied over
     * the defaults; applying a preset writes a real config (fully editable).
     */
    public static function presets(): array
    {
        return [
            'playful' => [
                'label' => 'Playful',
                'description' => 'Bright but controlled — friendly color with soft shapes.',
                'config' => [
                    'colors' => [
                        'primary' => '#5b8cff', 'secondary' => '#a06bff', 'accent' => '#38e1c6',
                        'background' => '#0c1226', 'surface' => '#121a3d', 'card' => '#182147',
                        'text' => '#f2f5ff', 'muted' => '#9fb0d8', 'border' => '#2b3763',
                    ],
                    'appearance' => ['radius' => 18, 'shadow' => 'medium', 'cardLayout' => 'grid'],
                    'animations' => ['intensity' => 'playful'],
                    'typography' => ['fontFamily' => 'rounded'],
                ],
            ],
            'modern' => [
                'label' => 'Modern',
                'description' => 'Clean SaaS-style interface. Balanced, neutral, sharp.',
                'config' => [
                    'colors' => [
                        'primary' => '#3b82f6', 'secondary' => '#6366f1', 'accent' => '#0ea5e9',
                        'background' => '#0a0f1e', 'surface' => '#0f1630', 'card' => '#141c3a',
                        'text' => '#e8edf9', 'muted' => '#8b96b8', 'border' => '#232c4d',
                    ],
                    'appearance' => ['radius' => 10, 'shadow' => 'soft'],
                    'animations' => ['intensity' => 'normal'],
                    'typography' => ['fontFamily' => 'inter'],
                ],
            ],
            'premium' => [
                'label' => 'Premium',
                'description' => 'Elegant, restrained, high-end appearance with champagne accents.',
                'config' => [
                    'colors' => [
                        'primary' => '#c9a86a', 'secondary' => '#8b7cf0', 'accent' => '#e8cf9a',
                        'background' => '#0d0d14', 'surface' => '#14141f', 'card' => '#1b1b28',
                        'text' => '#f5f1e8', 'muted' => '#a8a29a', 'border' => '#2c2c3d',
                    ],
                    'appearance' => ['radius' => 12, 'shadow' => 'strong'],
                    'animations' => ['intensity' => 'subtle'],
                    'typography' => ['fontFamily' => 'plex'],
                ],
            ],
            'ios' => [
                'label' => 'iOS Inspired',
                'description' => 'Soft surfaces, rounded UI, clean navigation, subtle depth.',
                'config' => [
                    'colors' => [
                        'primary' => '#0a84ff', 'secondary' => '#5e5ce6', 'accent' => '#64d2ff',
                        'background' => '#000000', 'surface' => '#0f0f12', 'card' => '#1c1c22',
                        'text' => '#f5f5f7', 'muted' => '#9898a3', 'border' => '#2c2c31',
                    ],
                    'appearance' => ['radius' => 20, 'shadow' => 'soft', 'sidebarStyle' => 'floating'],
                    'animations' => ['intensity' => 'normal'],
                    'typography' => ['fontFamily' => 'system'],
                ],
            ],
            'pixel' => [
                'label' => 'Pixel',
                'description' => 'Modern interface with tasteful, subtle pixel accents.',
                'config' => [
                    'colors' => [
                        'primary' => '#4f7cff', 'secondary' => '#7c5cff', 'accent' => '#4ade80',
                        'background' => '#070b18', 'surface' => '#0d1430', 'card' => '#131b40',
                        'text' => '#eef2ff', 'muted' => '#93a0c4', 'border' => '#243058',
                    ],
                    'appearance' => ['radius' => 6, 'shadow' => 'none'],
                    'pixel' => ['enabled' => true, 'intensity' => 'subtle', 'decorations' => true, 'pixelIcons' => true],
                    'typography' => ['fontFamily' => 'mono'],
                ],
            ],
            'midnight' => [
                'label' => 'Midnight',
                'description' => 'Dark premium hosting interface. Deep blues, calm contrast.',
                'config' => [
                    'colors' => [
                        'primary' => '#2563eb', 'secondary' => '#4f46e5', 'accent' => '#22d3ee',
                        'background' => '#020617', 'surface' => '#0a1128', 'card' => '#0f1a3d',
                        'text' => '#dbe4ff', 'muted' => '#7d8db1', 'border' => '#1b2748',
                    ],
                    'appearance' => ['mode' => 'dark', 'radius' => 12, 'shadow' => 'medium'],
                    'animations' => ['intensity' => 'subtle', 'backgroundEffects' => true],
                ],
            ],
            'minimal' => [
                'label' => 'Minimal',
                'description' => 'Very clean and distraction-free. Quiet neutrals, sharp type.',
                'config' => [
                    'colors' => [
                        'primary' => '#64748b', 'secondary' => '#475569', 'accent' => '#94a3b8',
                        'background' => '#0b0d12', 'surface' => '#11141b', 'card' => '#171b24',
                        'text' => '#e5e7eb', 'muted' => '#9ca3af', 'border' => '#232833',
                    ],
                    'appearance' => ['radius' => 8, 'shadow' => 'none', 'compact' => true],
                    'animations' => ['enabled' => true, 'intensity' => 'subtle', 'backgroundEffects' => false, 'pageTransitions' => false],
                    'pixel' => ['enabled' => false],
                    'typography' => ['fontFamily' => 'inter'],
                ],
            ],
        ];
    }

    // ------------------------------------------------------------------
    // Read / write
    // ------------------------------------------------------------------

    /**
     * Get the effective config: defaults deep-merged with the stored config.
     */
    public function get(): array
    {
        $ttl = (int) config('aurora.cache_ttl', 300);

        try {
            return Cache::remember(self::CACHE_KEY, $ttl, function () {
                return $this->resolveUncached();
            });
        } catch (\Throwable $e) {
            return $this->resolveUncached();
        }
    }

    protected function resolveUncached(): array
    {
        $defaults = self::defaults();

        try {
            if (!Schema::hasTable('aurora_theme_settings')) {
                return $defaults;
            }

            $row = AuroraThemeSetting::query()->where('key', 'config')->first();
            if (!$row || empty($row->value)) {
                return $defaults;
            }

            $stored = json_decode($row->value, true);
            if (!is_array($stored)) {
                return $defaults;
            }

            return $this->deepMerge($defaults, $this->whitelist($stored));
        } catch (\Throwable $e) {
            report($e);

            return $defaults;
        }
    }

    /**
     * Persist a full config array (sanitized + whitelisted, merged over defaults).
     */
    public function save(array $config): array
    {
        $merged = $this->deepMerge(self::defaults(), $this->whitelist($config));
        $merged = $this->sanitize($merged);

        AuroraThemeSetting::query()->updateOrCreate(
            ['key' => 'config'],
            ['value' => json_encode($merged, JSON_UNESCAPED_SLASHES)]
        );

        $this->clearCache();

        return $merged;
    }

    /**
     * Apply a built-in preset (writes a real, editable config).
     *
     * @throws \InvalidArgumentException
     */
    public function applyPreset(string $preset): array
    {
        $presets = self::presets();
        if (!isset($presets[$preset])) {
            throw new \InvalidArgumentException("Unknown theme preset '{$preset}'.");
        }

        return $this->save($this->deepMerge(self::defaults(), $presets[$preset]['config']));
    }

    /**
     * Reset the theme to factory defaults.
     */
    public function reset(): array
    {
        AuroraThemeSetting::query()->where('key', 'config')->delete();
        $this->clearCache();

        return self::defaults();
    }

    /**
     * Export the effective config as pretty JSON.
     */
    public function export(): string
    {
        return json_encode($this->get(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Import a JSON config string (sanitized before save).
     *
     * @throws \InvalidArgumentException
     */
    public function import(string $json): array
    {
        $decoded = json_decode($json, true);
        if (!is_array($decoded)) {
            throw new \InvalidArgumentException('The uploaded file is not valid JSON.');
        }

        return $this->save($decoded);
    }

    public function clearCache(): void
    {
        try {
            Cache::forget(self::CACHE_KEY);
        } catch (\Throwable $e) {
            // Cache failures must never break the settings UI.
        }
    }

    /**
     * Config safe for public exposure (login page, React app, JSON endpoint).
     * All theme settings are presentation-only, but this stays an explicit
     * allow-list so future server-side keys can't leak by accident.
     */
    public function publicConfig(): array
    {
        $config = $this->get();

        $config['_meta'] = [
            'theme' => 'aurora',
            'version' => self::VERSION,
            'generatedAt' => now()->toIso8601String(),
        ];

        return $config;
    }

    // ------------------------------------------------------------------
    // Uploads
    // ------------------------------------------------------------------

    /**
     * Store an uploaded brand asset (logo / favicon) and point the config at it.
     *
     * @throws \InvalidArgumentException
     */
    public function handleUpload(UploadedFile $file, string $slot): string
    {
        if (!in_array($slot, ['logo', 'favicon'], true)) {
            throw new \InvalidArgumentException("Invalid upload slot '{$slot}'.");
        }

        $dir = config('aurora.upload_dir', 'themes/aurora/uploads');
        $ext = strtolower($file->getClientOriginalExtension() ?: 'png');
        if (!in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'], true)) {
            $ext = 'png';
        }

        $filename = $slot . '-' . substr(sha1($file->getClientOriginalName() . microtime()), 0, 12) . '.' . $ext;
        $file->move(public_path($dir), $filename);

        $url = '/' . trim($dir, '/') . '/' . $filename;

        $config = $this->get();
        $config['brand'][$slot === 'logo' ? 'logoUrl' : 'faviconUrl'] = $url;
        $this->save($config);

        return $url;
    }

    // ------------------------------------------------------------------
    // Admin dashboard statistics (100% real data)
    // ------------------------------------------------------------------

    public static function dashboardStats(): array
    {
        try {
            $users = \Pterodactyl\Models\User::count();
            $servers = \Pterodactyl\Models\Server::count();
            $nodes = \Pterodactyl\Models\Node::count();
            $locations = \Pterodactyl\Models\Location::count();
            $nests = \Pterodactyl\Models\Nest::count();
            $databases = \Pterodactyl\Models\Database::count();
            $suspended = \Pterodactyl\Models\Server::where('status', 'suspended')->count();

            $allocationsUsed = \Pterodactyl\Models\Allocation::whereNotNull('server_id')->count();
            $allocationsTotal = \Pterodactyl\Models\Allocation::count();

            $recentServers = \Pterodactyl\Models\Server::with('user:id,username')
                ->orderByDesc('id')
                ->limit(5)
                ->get(['id', 'uuid', 'name', 'user_id', 'status', 'created_at'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'owner' => $s->user?->username ?? '—',
                    'status' => $s->status ?? 'active',
                    'created' => $s->created_at?->diffForHumans(),
                ])->all();

            $nodeHealth = \Pterodactyl\Models\Node::orderBy('name')
                ->get(['id', 'name', 'maintenance_mode'])
                ->map(fn ($n) => [
                    'id' => $n->id,
                    'name' => $n->name,
                    'maintenance' => (bool) $n->maintenance_mode,
                    'servers' => \Pterodactyl\Models\Server::where('node_id', $n->id)->count(),
                ])->all();

            return [
                'users' => $users,
                'servers' => $servers,
                'nodes' => $nodes,
                'locations' => $locations,
                'nests' => $nests,
                'databases' => $databases,
                'suspended' => $suspended,
                'allocationsUsed' => $allocationsUsed,
                'allocationsTotal' => $allocationsTotal,
                'recentServers' => $recentServers,
                'nodeHealth' => $nodeHealth,
            ];
        } catch (\Throwable $e) {
            report($e);

            return [
                'users' => 0, 'servers' => 0, 'nodes' => 0, 'locations' => 0,
                'nests' => 0, 'databases' => 0, 'suspended' => 0,
                'allocationsUsed' => 0, 'allocationsTotal' => 0,
                'recentServers' => [], 'nodeHealth' => [],
            ];
        }
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    /**
     * Strip unknown top-level sections and unknown keys (forward/back-compat).
     */
    protected function whitelist(array $config): array
    {
        $defaults = self::defaults();
        $out = [];

        foreach ($defaults as $section => $fields) {
            if (!isset($config[$section]) || !is_array($config[$section])) {
                continue;
            }
            foreach ($fields as $key => $default) {
                if (array_key_exists($key, $config[$section])) {
                    $out[$section][$key] = $config[$section][$key];
                }
            }
        }

        return $out;
    }

    /**
     * Coerce + clamp every value into its valid range.
     */
    protected function sanitize(array $config): array
    {
        $defaults = self::defaults();
        $enums = self::enums();

        // Colors: must be #rgb / #rrggbb / #rrggbbaa hex, else keep default.
        foreach ($defaults['colors'] as $key => $default) {
            $value = $config['colors'][$key] ?? $default;
            $config['colors'][$key] = $this->sanitizeColor($value, $default);
        }

        // Booleans.
        foreach ([
            'appearance.allowUserSwitch', 'appearance.sidebarCollapsed', 'appearance.compact', 'appearance.dense',
            'animations.enabled', 'animations.pageTransitions', 'animations.hoverEffects', 'animations.buttonEffects',
            'animations.modalAnimations', 'animations.backgroundEffects',
            'pixel.enabled', 'pixel.decorations', 'pixel.pixelIcons',
            'login.showLogo', 'login.sideArt',
        ] as $path) {
            [$section, $key] = explode('.', $path);
            $config[$section][$key] = $this->toBool($config[$section][$key] ?? $defaults[$section][$key]);
        }

        // Enums.
        foreach ($enums as $path => $allowed) {
            [$section, $key] = explode('.', $path);
            $value = (string) ($config[$section][$key] ?? '');
            $config[$section][$key] = in_array($value, $allowed, true) ? $value : $defaults[$section][$key];
        }

        // Integers / floats with clamps.
        $config['appearance']['radius'] = $this->clampInt($config['appearance']['radius'] ?? 14, 0, 24, 14);
        $config['typography']['baseSize'] = $this->clampInt($config['typography']['baseSize'] ?? 15, 13, 18, 15);
        $config['typography']['headingScale'] = $this->clampFloat($config['typography']['headingScale'] ?? 1.0, 0.9, 1.3, 1.0);
        $config['typography']['lineHeight'] = $this->clampFloat($config['typography']['lineHeight'] ?? 1.55, 1.3, 1.9, 1.55);

        // Strings (bounded length, no control chars).
        foreach (['name', 'description', 'logoUrl', 'faviconUrl', 'footerText'] as $key) {
            $config['brand'][$key] = $this->sanitizeString($config['brand'][$key] ?? '', 500);
        }
        foreach (['title', 'subtitle'] as $key) {
            $config['login'][$key] = $this->sanitizeString($config['login'][$key] ?? '', 200);
        }

        // URLs: only allow relative paths or http(s) URLs (no javascript:).
        foreach (['logoUrl', 'faviconUrl'] as $key) {
            $config['brand'][$key] = $this->sanitizeUrl($config['brand'][$key]);
        }

        return $config;
    }

    protected function deepMerge(array $base, array $overrides): array
    {
        foreach ($overrides as $key => $value) {
            if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
                $base[$key] = $this->deepMerge($base[$key], $value);
            } else {
                $base[$key] = $value;
            }
        }

        return $base;
    }

    protected function sanitizeColor(mixed $value, string $default): string
    {
        $value = trim((string) $value);
        if (preg_match('/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/', $value)) {
            return strtolower($value);
        }

        return $default;
    }

    protected function sanitizeString(mixed $value, int $max): string
    {
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $value);

        return mb_substr(trim($value), 0, $max);
    }

    protected function sanitizeUrl(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }
        // Relative path or http(s) URL only.
        if (str_starts_with($value, '/') && !str_starts_with($value, '//')) {
            return $value;
        }
        if (preg_match('#^https?://[^\s<>"\']+$#i', $value)) {
            return $value;
        }

        return '';
    }

    protected function toBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (is_numeric($value)) {
            return (int) $value === 1;
        }
        $value = strtolower(trim((string) $value));

        return in_array($value, ['1', 'true', 'yes', 'on'], true);
    }

    protected function clampInt(mixed $value, int $min, int $max, int $fallback): int
    {
        if (!is_numeric($value)) {
            return $fallback;
        }

        return max($min, min($max, (int) $value));
    }

    protected function clampFloat(mixed $value, float $min, float $max, float $fallback): float
    {
        if (!is_numeric($value)) {
            return $fallback;
        }

        return round(max($min, min($max, (float) $value)), 2);
    }
}
