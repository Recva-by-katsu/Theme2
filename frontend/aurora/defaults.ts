/**
 * Aurora Theme — defaults & presets (TypeScript mirror of the PHP service).
 *
 * The live config is injected by the backend (window.AuroraTheme) or fetched
 * from /aurora/theme.json. These defaults are the offline/first-paint
 * fallback so the UI never renders unstyled.
 */
import { AuroraPreset, AuroraThemeConfig, DeepPartial } from './types';

export const AURORA_DEFAULTS: AuroraThemeConfig = {
    brand: {
        name: '',
        description: 'Game & application server management, beautifully simple.',
        logoUrl: '',
        faviconUrl: '',
        footerText: '',
    },
    colors: {
        primary: '#4f7cff',
        secondary: '#7c5cff',
        accent: '#22d3ee',
        background: '#0b1020',
        surface: '#101737',
        card: '#151d42',
        text: '#eef2ff',
        muted: '#9aa6c7',
        border: '#263056',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#38bdf8',
    },
    appearance: {
        mode: 'system',
        allowUserSwitch: true,
        sidebarStyle: 'floating',
        sidebarCollapsed: false,
        compact: false,
        dense: false,
        cardLayout: 'grid',
        radius: 14,
        shadow: 'soft',
    },
    animations: {
        enabled: true,
        intensity: 'normal',
        pageTransitions: true,
        hoverEffects: true,
        buttonEffects: true,
        modalAnimations: true,
        backgroundEffects: true,
        loadingStyle: 'skeleton',
    },
    pixel: {
        enabled: false,
        intensity: 'subtle',
        decorations: true,
        pixelIcons: false,
    },
    typography: {
        fontFamily: 'system',
        baseSize: 15,
        headingScale: 1.0,
        weight: '400',
        lineHeight: 1.55,
    },
    login: {
        title: '',
        subtitle: '',
        showLogo: true,
        background: 'mesh',
        cardStyle: 'glass',
        sideArt: true,
    },
};

export function deepMerge<T>(base: T, overrides?: DeepPartial<T>): T {
    if (!overrides) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(overrides)) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            out[key] = deepMerge(
                ((base as Record<string, unknown>)[key] ?? {}) as Record<string, unknown>,
                value as Record<string, unknown>
            );
        } else if (value !== undefined) {
            out[key] = value;
        }
    }
    return out as T;
}

export function withDefaults(config?: DeepPartial<AuroraThemeConfig>): AuroraThemeConfig {
    return deepMerge<AuroraThemeConfig>(
        JSON.parse(JSON.stringify(AURORA_DEFAULTS)) as AuroraThemeConfig,
        config
    );
}

export const AURORA_PRESETS: AuroraPreset[] = [
    {
        key: 'playful',
        label: 'Playful',
        description: 'Bright but controlled — friendly color with soft shapes.',
        config: {
            colors: {
                primary: '#5b8cff',
                secondary: '#a06bff',
                accent: '#38e1c6',
                background: '#0c1226',
                surface: '#121a3d',
                card: '#182147',
                text: '#f2f5ff',
                muted: '#9fb0d8',
                border: '#2b3763',
            },
            appearance: { radius: 18, shadow: 'medium', cardLayout: 'grid' },
            animations: { intensity: 'playful' },
            typography: { fontFamily: 'rounded' },
        },
    },
    {
        key: 'modern',
        label: 'Modern',
        description: 'Clean SaaS-style interface. Balanced, neutral, sharp.',
        config: {
            colors: {
                primary: '#3b82f6',
                secondary: '#6366f1',
                accent: '#0ea5e9',
                background: '#0a0f1e',
                surface: '#0f1630',
                card: '#141c3a',
                text: '#e8edf9',
                muted: '#8b96b8',
                border: '#232c4d',
            },
            appearance: { radius: 10, shadow: 'soft' },
            animations: { intensity: 'normal' },
            typography: { fontFamily: 'inter' },
        },
    },
    {
        key: 'premium',
        label: 'Premium',
        description: 'Elegant, restrained, high-end appearance with champagne accents.',
        config: {
            colors: {
                primary: '#c9a86a',
                secondary: '#8b7cf0',
                accent: '#e8cf9a',
                background: '#0d0d14',
                surface: '#14141f',
                card: '#1b1b28',
                text: '#f5f1e8',
                muted: '#a8a29a',
                border: '#2c2c3d',
            },
            appearance: { radius: 12, shadow: 'strong' },
            animations: { intensity: 'subtle' },
            typography: { fontFamily: 'plex' },
        },
    },
    {
        key: 'ios',
        label: 'iOS Inspired',
        description: 'Soft surfaces, rounded UI, clean navigation, subtle depth.',
        config: {
            colors: {
                primary: '#0a84ff',
                secondary: '#5e5ce6',
                accent: '#64d2ff',
                background: '#000000',
                surface: '#0f0f12',
                card: '#1c1c22',
                text: '#f5f5f7',
                muted: '#9898a3',
                border: '#2c2c31',
            },
            appearance: { radius: 20, shadow: 'soft', sidebarStyle: 'floating' },
            animations: { intensity: 'normal' },
            typography: { fontFamily: 'system' },
        },
    },
    {
        key: 'pixel',
        label: 'Pixel',
        description: 'Modern interface with tasteful, subtle pixel accents.',
        config: {
            colors: {
                primary: '#4f7cff',
                secondary: '#7c5cff',
                accent: '#4ade80',
                background: '#070b18',
                surface: '#0d1430',
                card: '#131b40',
                text: '#eef2ff',
                muted: '#93a0c4',
                border: '#243058',
            },
            appearance: { radius: 6, shadow: 'none' },
            pixel: { enabled: true, intensity: 'subtle', decorations: true, pixelIcons: true },
            typography: { fontFamily: 'mono' },
        },
    },
    {
        key: 'midnight',
        label: 'Midnight',
        description: 'Dark premium hosting interface. Deep blues, calm contrast.',
        config: {
            colors: {
                primary: '#2563eb',
                secondary: '#4f46e5',
                accent: '#22d3ee',
                background: '#020617',
                surface: '#0a1128',
                card: '#0f1a3d',
                text: '#dbe4ff',
                muted: '#7d8db1',
                border: '#1b2748',
            },
            appearance: { mode: 'dark', radius: 12, shadow: 'medium' },
            animations: { intensity: 'subtle', backgroundEffects: true },
        },
    },
    {
        key: 'minimal',
        label: 'Minimal',
        description: 'Very clean and distraction-free. Quiet neutrals, sharp type.',
        config: {
            colors: {
                primary: '#64748b',
                secondary: '#475569',
                accent: '#94a3b8',
                background: '#0b0d12',
                surface: '#11141b',
                card: '#171b24',
                text: '#e5e7eb',
                muted: '#9ca3af',
                border: '#232833',
            },
            appearance: { radius: 8, shadow: 'none', compact: true },
            animations: {
                enabled: true,
                intensity: 'subtle',
                backgroundEffects: false,
                pageTransitions: false,
            },
            pixel: { enabled: false },
            typography: { fontFamily: 'inter' },
        },
    },
];
