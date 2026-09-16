import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ThemeSettings } from '@/state/settings';
import { ApplicationStore } from '@/state';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValues {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    resolvedMode: 'light' | 'dark';
    canSwitchMode: boolean;
    theme: ThemeSettings;
}

const DEFAULT_THEME: ThemeSettings = {
    version: '1.0.0',
    themeName: 'Orbit Panel Theme',
    brandName: 'Pterodactyl',
    brandDescription: 'Premium hosting control panel experience.',
    assets: { logo: '', favicon: '', site_icon: '' },
    login: {
        logo: '',
        title: 'Welcome back',
        description: 'Sign in to continue.',
        background: '',
        background_effects: true,
        accent_color: '#0ea5e9',
        card_style: 'elevated',
        illustration: '',
    },
    colors: {
        primary: '#4f8df9',
        secondary: '#0ea5e9',
        accent: '#22c55e',
        background: '#0c1221',
        surface: '#141c2f',
        card: '#1d2740',
        text: '#ecf2ff',
        muted_text: '#9aa7c5',
        border: '#27344f',
    },
    radius: 14,
    shadowIntensity: 'medium',
    appearance: {
        default_mode: 'system',
        allow_user_theme: true,
        sidebar_style: 'solid',
        sidebar_width: 'normal',
        sidebar_collapse: false,
        compact_mode: false,
        dense_mode: false,
        card_layout: 'grid',
    },
    animation: {
        enabled: true,
        intensity: 'medium',
        page_transitions: true,
        hover_effects: true,
        button_effects: true,
        modal_animations: true,
        background_effects: false,
        loading_animations: true,
    },
    pixel: {
        enabled: false,
        intensity: 20,
        decorations: true,
        icons: false,
    },
    typography: {
        font_family: 'Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
        font_size: 15,
        heading_scale: 1.1,
        font_weight: 500,
        line_height: 1.45,
    },
    preset: 'modern',
};

const STORAGE_KEY = 'orbit-theme-mode';

const ThemeContext = createContext<ThemeContextValues>({
    mode: 'system',
    setMode: () => undefined,
    resolvedMode: 'dark',
    canSwitchMode: true,
    theme: DEFAULT_THEME,
});

const hexToRgb = (value: string) => {
    const hex = value.replace('#', '').trim();
    if (hex.length !== 6) return null;

    const num = Number.parseInt(hex, 16);
    if (Number.isNaN(num)) return null;

    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
};

const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b]
        .map((channel) =>
            Math.max(0, Math.min(255, Math.round(channel)))
                .toString(16)
                .padStart(2, '0')
        )
        .join('')}`;

const mix = (first: string, second: string, weight = 0.5): string => {
    const start = hexToRgb(first);
    const end = hexToRgb(second);

    if (!start || !end) return first;

    return rgbToHex(
        start.r + (end.r - start.r) * weight,
        start.g + (end.g - start.g) * weight,
        start.b + (end.b - start.b) * weight
    );
};

const resolveMode = (mode: ThemeMode): 'light' | 'dark' => {
    if (mode !== 'system') return mode;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }

    return 'dark';
};

const applyTheme = (theme: ThemeSettings, mode: 'light' | 'dark') => {
    const root = document.documentElement;
    const palette = { ...theme.colors };

    if (mode === 'light') {
        palette.background = mix(theme.colors.background, '#ffffff', 0.92);
        palette.surface = mix(theme.colors.surface, '#ffffff', 0.84);
        palette.card = mix(theme.colors.card, '#ffffff', 0.8);
        palette.text = '#0f172a';
        palette.muted_text = '#475569';
        palette.border = mix(theme.colors.border, '#e2e8f0', 0.72);
    }

    root.style.setProperty('--theme-primary', palette.primary);
    root.style.setProperty('--theme-secondary', palette.secondary);
    root.style.setProperty('--theme-accent', palette.accent);
    root.style.setProperty('--theme-bg', palette.background);
    root.style.setProperty('--theme-surface', palette.surface);
    root.style.setProperty('--theme-card', palette.card);
    root.style.setProperty('--theme-text', palette.text);
    root.style.setProperty('--theme-muted', palette.muted_text);
    root.style.setProperty('--theme-border', palette.border);
    root.style.setProperty('--theme-radius', `${theme.radius}px`);
    root.style.setProperty('--theme-font-family', theme.typography.font_family);
    root.style.setProperty('--theme-font-size', `${theme.typography.font_size}px`);
    root.style.setProperty('--theme-line-height', String(theme.typography.line_height));
    root.style.setProperty('--theme-heading-scale', String(theme.typography.heading_scale));
    root.style.setProperty('--theme-font-weight', String(theme.typography.font_weight));
    root.style.setProperty('--theme-login-accent', theme.login.accent_color);
    root.style.setProperty('--theme-pixel-intensity', String(theme.pixel.intensity / 100));

    root.classList.toggle('theme-mode-light', mode === 'light');
    root.classList.toggle('theme-mode-dark', mode === 'dark');
    root.classList.toggle('theme-compact', theme.appearance.compact_mode);
    root.classList.toggle('theme-dense', theme.appearance.dense_mode);
    root.classList.toggle('theme-sidebar-collapsed', theme.appearance.sidebar_collapse);
    root.classList.toggle('theme-pixel', theme.pixel.enabled);
    root.classList.toggle('theme-animations-disabled', !theme.animation.enabled);
    root.classList.toggle('theme-hover-effects', theme.animation.hover_effects);
    root.classList.toggle('theme-button-effects', theme.animation.button_effects);

    if (typeof window !== 'undefined' && window.matchMedia) {
        root.classList.toggle('theme-reduced-motion', window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    root.dataset.sidebarStyle = theme.appearance.sidebar_style;
    root.dataset.sidebarWidth = theme.appearance.sidebar_width;
    root.dataset.cardLayout = theme.appearance.card_layout;
    root.dataset.animationLevel = theme.animation.intensity;
    root.dataset.themePreset = theme.preset;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const configuredTheme = useStoreState((state: ApplicationStore) => state.settings.data?.theme);
    const theme = configuredTheme || DEFAULT_THEME;

    const [mode, setModeState] = useState<ThemeMode>(() => {
        const value = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        if (!value) return theme.appearance.default_mode;

        return ['light', 'dark', 'system'].includes(value) ? value : theme.appearance.default_mode;
    });

    const canSwitchMode = theme.appearance.allow_user_theme;
    const resolvedMode = useMemo(
        () => resolveMode(canSwitchMode ? mode : theme.appearance.default_mode),
        [mode, canSwitchMode, theme.appearance.default_mode]
    );

    useEffect(() => {
        if (!canSwitchMode) {
            setModeState(theme.appearance.default_mode);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [canSwitchMode, theme.appearance.default_mode]);

    useEffect(() => {
        applyTheme(theme, resolvedMode);
    }, [theme, resolvedMode]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return;
        }

        const listener = () => {
            const next = resolveMode(canSwitchMode ? mode : theme.appearance.default_mode);
            applyTheme(theme, next);
        };

        const media = window.matchMedia('(prefers-color-scheme: light)');
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [mode, canSwitchMode, theme]);

    const setMode = (nextMode: ThemeMode) => {
        if (!canSwitchMode) return;

        setModeState(nextMode);
        localStorage.setItem(STORAGE_KEY, nextMode);
    };

    return (
        <ThemeContext.Provider value={{ mode, setMode, resolvedMode, canSwitchMode, theme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
