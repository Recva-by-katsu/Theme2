<?php

namespace Pterodactyl\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Pterodactyl\Services\AuroraThemeService;

class AuroraThemeRequest extends FormRequest
{
    /**
     * Only root admins reach admin routes (AdminAuthenticate middleware),
     * but we double-check here so the endpoint is safe on its own.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->root_admin;
    }

    public function rules(): array
    {
        $enums = AuroraThemeService::enums();
        $in = fn (string $path) => 'required|in:' . implode(',', $enums[$path]);

        return [
            'brand.name' => 'nullable|string|max:120',
            'brand.description' => 'nullable|string|max:500',
            'brand.logoUrl' => 'nullable|string|max:500',
            'brand.faviconUrl' => 'nullable|string|max:500',
            'brand.footerText' => 'nullable|string|max:500',

            'colors.primary' => 'required|string|max:9',
            'colors.secondary' => 'required|string|max:9',
            'colors.accent' => 'required|string|max:9',
            'colors.background' => 'required|string|max:9',
            'colors.surface' => 'required|string|max:9',
            'colors.card' => 'required|string|max:9',
            'colors.text' => 'required|string|max:9',
            'colors.muted' => 'required|string|max:9',
            'colors.border' => 'required|string|max:9',
            'colors.success' => 'required|string|max:9',
            'colors.warning' => 'required|string|max:9',
            'colors.danger' => 'required|string|max:9',
            'colors.info' => 'required|string|max:9',

            'appearance.mode' => $in('appearance.mode'),
            'appearance.allowUserSwitch' => 'required|boolean',
            'appearance.sidebarStyle' => $in('appearance.sidebarStyle'),
            'appearance.sidebarCollapsed' => 'required|boolean',
            'appearance.compact' => 'required|boolean',
            'appearance.dense' => 'required|boolean',
            'appearance.cardLayout' => $in('appearance.cardLayout'),
            'appearance.radius' => 'required|integer|min:0|max:24',
            'appearance.shadow' => $in('appearance.shadow'),

            'animations.enabled' => 'required|boolean',
            'animations.intensity' => $in('animations.intensity'),
            'animations.pageTransitions' => 'required|boolean',
            'animations.hoverEffects' => 'required|boolean',
            'animations.buttonEffects' => 'required|boolean',
            'animations.modalAnimations' => 'required|boolean',
            'animations.backgroundEffects' => 'required|boolean',
            'animations.loadingStyle' => $in('animations.loadingStyle'),

            'pixel.enabled' => 'required|boolean',
            'pixel.intensity' => $in('pixel.intensity'),
            'pixel.decorations' => 'required|boolean',
            'pixel.pixelIcons' => 'required|boolean',

            'typography.fontFamily' => $in('typography.fontFamily'),
            'typography.baseSize' => 'required|integer|min:13|max:18',
            'typography.headingScale' => 'required|numeric|min:0.9|max:1.3',
            'typography.weight' => $in('typography.weight'),
            'typography.lineHeight' => 'required|numeric|min:1.3|max:1.9',

            'login.title' => 'nullable|string|max:200',
            'login.subtitle' => 'nullable|string|max:200',
            'login.showLogo' => 'required|boolean',
            'login.background' => $in('login.background'),
            'login.cardStyle' => $in('login.cardStyle'),
            'login.sideArt' => 'required|boolean',
        ];
    }

    /**
     * Validated payload as a nested config array.
     */
    public function normalized(): array
    {
        return $this->validated();
    }
}
