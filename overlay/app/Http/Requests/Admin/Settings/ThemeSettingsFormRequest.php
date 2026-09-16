<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class ThemeSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'theme' => 'required|array',
            'theme.theme_name' => 'required|string|max:120',
            'theme.brand_name' => 'required|string|max:120',
            'theme.brand_description' => 'nullable|string|max:255',
            'theme.assets.logo' => 'nullable|string|max:500',
            'theme.assets.favicon' => 'nullable|string|max:500',
            'theme.assets.site_icon' => 'nullable|string|max:500',
            'theme.preset' => ['required', Rule::in(['playful', 'modern', 'premium', 'ios-inspired', 'pixel', 'midnight', 'minimal'])],
            'theme.colors.primary' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.colors.secondary' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.colors.accent' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.colors.background' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.colors.surface' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.colors.card' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.colors.text' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.colors.muted_text' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.colors.border' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.radius' => 'required|integer|between:6,28',
            'theme.shadow_intensity' => ['required', Rule::in(['none', 'soft', 'medium', 'strong'])],
            'theme.appearance.default_mode' => ['required', Rule::in(['light', 'dark', 'system'])],
            'theme.appearance.allow_user_theme' => 'required|boolean',
            'theme.appearance.sidebar_style' => ['required', Rule::in(['solid', 'floating', 'glass'])],
            'theme.appearance.sidebar_width' => ['required', Rule::in(['compact', 'normal', 'wide'])],
            'theme.appearance.sidebar_collapse' => 'required|boolean',
            'theme.appearance.compact_mode' => 'required|boolean',
            'theme.appearance.dense_mode' => 'required|boolean',
            'theme.appearance.card_layout' => ['required', Rule::in(['grid', 'comfortable', 'compact'])],
            'theme.animation.enabled' => 'required|boolean',
            'theme.animation.intensity' => ['required', Rule::in(['subtle', 'medium', 'high'])],
            'theme.animation.page_transitions' => 'required|boolean',
            'theme.animation.hover_effects' => 'required|boolean',
            'theme.animation.button_effects' => 'required|boolean',
            'theme.animation.modal_animations' => 'required|boolean',
            'theme.animation.background_effects' => 'required|boolean',
            'theme.animation.loading_animations' => 'required|boolean',
            'theme.pixel.enabled' => 'required|boolean',
            'theme.pixel.intensity' => 'required|integer|between:0,100',
            'theme.pixel.decorations' => 'required|boolean',
            'theme.pixel.icons' => 'required|boolean',
            'theme.typography.font_family' => 'required|string|max:255',
            'theme.typography.font_size' => 'required|integer|between:13,18',
            'theme.typography.heading_scale' => 'required|numeric|between:1,1.35',
            'theme.typography.font_weight' => 'required|integer|between:400,700',
            'theme.typography.line_height' => 'required|numeric|between:1.2,1.7',
            'theme.login.logo' => 'nullable|string|max:500',
            'theme.login.title' => 'required|string|max:120',
            'theme.login.description' => 'required|string|max:255',
            'theme.login.background' => 'nullable|string|max:500',
            'theme.login.background_effects' => 'required|boolean',
            'theme.login.accent_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.login.card_style' => ['required', Rule::in(['elevated', 'minimal', 'glass'])],
            'theme.login.illustration' => 'nullable|string|max:500',
        ];
    }
}
