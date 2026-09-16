<?php

namespace Pterodactyl\Services\Themes;

use Illuminate\Support\Arr;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class ThemeSettingsService
{
    public const SETTINGS_KEY = 'theme::configuration';
    public const THEME_VERSION = '1.1.0';

    private const PRESETS = [
        'playful' => [
            'label' => 'Playful',
            'description' => 'Bright but controlled with friendly accents.',
            'colors' => ['primary' => '#5b8cff', 'secondary' => '#8b5cf6', 'accent' => '#34d399', 'background' => '#0f1324', 'surface' => '#161d33', 'card' => '#1d2743', 'text' => '#f4f7ff', 'muted_text' => '#aab6d6', 'border' => '#2a3760'],
            'appearance' => ['default_mode' => 'dark', 'card_layout' => 'grid'],
        ],
        'modern' => [
            'label' => 'Modern',
            'description' => 'Clean SaaS style with balanced contrast.',
            'colors' => ['primary' => '#4f8df9', 'secondary' => '#0ea5e9', 'accent' => '#22c55e', 'background' => '#0c1221', 'surface' => '#141c2f', 'card' => '#1d2740', 'text' => '#ecf2ff', 'muted_text' => '#9aa7c5', 'border' => '#27344f'],
            'appearance' => ['default_mode' => 'system', 'card_layout' => 'grid'],
        ],
        'premium' => [
            'label' => 'Premium',
            'description' => 'Elegant contrast and restrained accents.',
            'colors' => ['primary' => '#7487ff', 'secondary' => '#5d6bf3', 'accent' => '#f59e0b', 'background' => '#10131c', 'surface' => '#171c28', 'card' => '#1e2535', 'text' => '#f8fafc', 'muted_text' => '#a2acbc', 'border' => '#303b50'],
            'appearance' => ['default_mode' => 'dark', 'card_layout' => 'comfortable'],
        ],
        'ios-inspired' => [
            'label' => 'iOS Inspired',
            'description' => 'Soft surfaces, rounded cards, and subtle depth.',
            'colors' => ['primary' => '#4f80ff', 'secondary' => '#6366f1', 'accent' => '#06b6d4', 'background' => '#f2f6ff', 'surface' => '#ffffff', 'card' => '#fbfdff', 'text' => '#0f172a', 'muted_text' => '#475569', 'border' => '#d8e0f0'],
            'appearance' => ['default_mode' => 'light', 'card_layout' => 'comfortable', 'sidebar_style' => 'floating'],
        ],
        'pixel' => [
            'label' => 'Pixel',
            'description' => 'Modern look with subtle pixel accents.',
            'colors' => ['primary' => '#60a5fa', 'secondary' => '#818cf8', 'accent' => '#22d3ee', 'background' => '#0a0f1f', 'surface' => '#121933', 'card' => '#182347', 'text' => '#eff6ff', 'muted_text' => '#9db0d8', 'border' => '#2b3f75'],
            'appearance' => ['default_mode' => 'dark', 'card_layout' => 'grid'],
            'pixel' => ['enabled' => true, 'decorations' => true, 'intensity' => 35],
        ],
        'midnight' => [
            'label' => 'Midnight',
            'description' => 'Dark premium hosting control panel palette.',
            'colors' => ['primary' => '#2563eb', 'secondary' => '#1d4ed8', 'accent' => '#22d3ee', 'background' => '#05080f', 'surface' => '#0c1324', 'card' => '#111a31', 'text' => '#e8eeff', 'muted_text' => '#8da0c9', 'border' => '#1f2e4f'],
            'appearance' => ['default_mode' => 'dark', 'card_layout' => 'compact'],
        ],
        'minimal' => [
            'label' => 'Minimal',
            'description' => 'Distraction-free with lightweight depth.',
            'colors' => ['primary' => '#4f46e5', 'secondary' => '#475569', 'accent' => '#22c55e', 'background' => '#f8fafc', 'surface' => '#ffffff', 'card' => '#ffffff', 'text' => '#0f172a', 'muted_text' => '#64748b', 'border' => '#e2e8f0'],
            'appearance' => ['default_mode' => 'light', 'card_layout' => 'compact'],
        ],
    ];

    public function __construct(private SettingsRepositoryInterface $settings)
    {
    }

    public function defaults(): array
    {
        return [
            'version' => self::THEME_VERSION,
            'theme_name' => 'Orbit Panel Theme',
            'brand_name' => config('app.name', 'Pterodactyl'),
            'brand_description' => 'Premium hosting control panel experience.',
            'assets' => [
                'logo' => '',
                'favicon' => '',
                'site_icon' => '',
            ],
            'preset' => 'modern',
            'colors' => [
                'primary' => '#4f8df9',
                'secondary' => '#0ea5e9',
                'accent' => '#22c55e',
                'background' => '#0c1221',
                'surface' => '#141c2f',
                'card' => '#1d2740',
                'text' => '#ecf2ff',
                'muted_text' => '#9aa7c5',
                'border' => '#27344f',
            ],
            'radius' => 14,
            'shadow_intensity' => 'medium',
            'appearance' => [
                'default_mode' => 'system',
                'allow_user_theme' => true,
                'sidebar_style' => 'solid',
                'sidebar_width' => 'normal',
                'sidebar_collapse' => false,
                'compact_mode' => false,
                'dense_mode' => false,
                'card_layout' => 'grid',
            ],
            'animation' => [
                'enabled' => true,
                'intensity' => 'medium',
                'page_transitions' => true,
                'hover_effects' => true,
                'button_effects' => true,
                'modal_animations' => true,
                'background_effects' => false,
                'loading_animations' => true,
            ],
            'pixel' => [
                'enabled' => false,
                'intensity' => 20,
                'decorations' => true,
                'icons' => false,
            ],
            'typography' => [
                'font_family' => 'Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
                'font_size' => 15,
                'heading_scale' => 1.1,
                'font_weight' => 500,
                'line_height' => 1.45,
            ],
            'login' => [
                'logo' => '',
                'title' => 'Welcome back',
                'description' => 'Sign in to manage your servers and deployments.',
                'background' => '',
                'background_effects' => true,
                'accent_color' => '#0ea5e9',
                'card_style' => 'elevated',
                'illustration' => '',
            ],
        ];
    }

    public function presets(): array
    {
        return self::PRESETS;
    }

    public function get(): array
    {
        $payload = $this->settings->get(self::SETTINGS_KEY, null);
        if (is_string($payload) && trim($payload) !== '') {
            $decoded = json_decode($payload, true);
            if (is_array($decoded)) {
                return $this->normalize($decoded);
            }
        }

        return $this->normalize($this->defaults());
    }

    public function save(array $payload): array
    {
        $theme = $this->normalize(array_replace_recursive($this->get(), $payload));

        $this->settings->set(self::SETTINGS_KEY, json_encode($theme, JSON_UNESCAPED_SLASHES));

        return $theme;
    }

    public function reset(): array
    {
        $theme = $this->normalize($this->defaults());
        $this->settings->set(self::SETTINGS_KEY, json_encode($theme, JSON_UNESCAPED_SLASHES));

        return $theme;
    }

    public function toCssVariables(array $theme): array
    {
        return [
            '--theme-primary' => Arr::get($theme, 'colors.primary'),
            '--theme-secondary' => Arr::get($theme, 'colors.secondary'),
            '--theme-accent' => Arr::get($theme, 'colors.accent'),
            '--theme-bg' => Arr::get($theme, 'colors.background'),
            '--theme-surface' => Arr::get($theme, 'colors.surface'),
            '--theme-card' => Arr::get($theme, 'colors.card'),
            '--theme-text' => Arr::get($theme, 'colors.text'),
            '--theme-muted' => Arr::get($theme, 'colors.muted_text'),
            '--theme-border' => Arr::get($theme, 'colors.border'),
            '--theme-radius' => Arr::get($theme, 'radius') . 'px',
            '--theme-font-family' => Arr::get($theme, 'typography.font_family'),
            '--theme-font-size' => Arr::get($theme, 'typography.font_size') . 'px',
            '--theme-line-height' => (string) Arr::get($theme, 'typography.line_height'),
            '--theme-heading-scale' => (string) Arr::get($theme, 'typography.heading_scale'),
            '--theme-font-weight' => (string) Arr::get($theme, 'typography.font_weight'),
            '--theme-login-accent' => Arr::get($theme, 'login.accent_color'),
        ];
    }

    private function normalize(array $theme): array
    {
        $theme = array_replace_recursive($this->defaults(), $theme);
        $preset = Arr::get($theme, 'preset', 'modern');

        if (isset(self::PRESETS[$preset])) {
            $theme = array_replace_recursive($theme, Arr::except(self::PRESETS[$preset], ['label', 'description']));
        }

        $theme['preset'] = $preset;
        $theme['radius'] = $this->bound((int) Arr::get($theme, 'radius'), 6, 28);
        $theme['pixel']['intensity'] = $this->bound((int) Arr::get($theme, 'pixel.intensity'), 0, 100);

        $theme['typography']['font_size'] = $this->bound((int) Arr::get($theme, 'typography.font_size'), 13, 18);
        $theme['typography']['heading_scale'] = $this->boundFloat((float) Arr::get($theme, 'typography.heading_scale'), 1, 1.35);
        $theme['typography']['font_weight'] = $this->bound((int) Arr::get($theme, 'typography.font_weight'), 400, 700);
        $theme['typography']['line_height'] = $this->boundFloat((float) Arr::get($theme, 'typography.line_height'), 1.2, 1.7);

        foreach (['allow_user_theme', 'sidebar_collapse', 'compact_mode', 'dense_mode'] as $key) {
            $theme['appearance'][$key] = filter_var(Arr::get($theme, "appearance.{$key}"), FILTER_VALIDATE_BOOLEAN);
        }

        foreach (['enabled', 'page_transitions', 'hover_effects', 'button_effects', 'modal_animations', 'background_effects', 'loading_animations'] as $key) {
            $theme['animation'][$key] = filter_var(Arr::get($theme, "animation.{$key}"), FILTER_VALIDATE_BOOLEAN);
        }

        foreach (['enabled', 'decorations', 'icons'] as $key) {
            $theme['pixel'][$key] = filter_var(Arr::get($theme, "pixel.{$key}"), FILTER_VALIDATE_BOOLEAN);
        }

        $theme['login']['background_effects'] = filter_var(Arr::get($theme, 'login.background_effects'), FILTER_VALIDATE_BOOLEAN);
        $theme['version'] = self::THEME_VERSION;

        return $theme;
    }

    private function bound(int $value, int $min, int $max): int
    {
        return max($min, min($max, $value));
    }

    private function boundFloat(float $value, float $min, float $max): float
    {
        return max($min, min($max, $value));
    }
}
