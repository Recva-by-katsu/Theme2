/**
 * Aurora Theme — shared TypeScript types.
 *
 * This mirrors the PHP-side schema (AuroraThemeService::defaults()).
 * Keep both in sync when adding settings.
 */

export interface AuroraBrand {
    name: string;
    description: string;
    logoUrl: string;
    faviconUrl: string;
    footerText: string;
}

export interface AuroraColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    muted: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
}

export type AuroraMode = 'light' | 'dark' | 'system';
export type AuroraSidebarStyle = 'floating' | 'fixed' | 'top';
export type AuroraCardLayout = 'grid' | 'list';
export type AuroraShadow = 'none' | 'soft' | 'medium' | 'strong';

export interface AuroraAppearance {
    mode: AuroraMode;
    allowUserSwitch: boolean;
    sidebarStyle: AuroraSidebarStyle;
    sidebarCollapsed: boolean;
    compact: boolean;
    dense: boolean;
    cardLayout: AuroraCardLayout;
    radius: number;
    shadow: AuroraShadow;
}

export type AuroraIntensity = 'subtle' | 'normal' | 'playful';
export type AuroraLoadingStyle = 'skeleton' | 'spinner' | 'dots';

export interface AuroraAnimations {
    enabled: boolean;
    intensity: AuroraIntensity;
    pageTransitions: boolean;
    hoverEffects: boolean;
    buttonEffects: boolean;
    modalAnimations: boolean;
    backgroundEffects: boolean;
    loadingStyle: AuroraLoadingStyle;
}

export interface AuroraPixel {
    enabled: boolean;
    intensity: 'subtle' | 'normal' | 'bold';
    decorations: boolean;
    pixelIcons: boolean;
}

export interface AuroraTypography {
    fontFamily: 'system' | 'plex' | 'inter' | 'mono' | 'rounded';
    baseSize: number;
    headingScale: number;
    weight: string;
    lineHeight: number;
}

export interface AuroraLogin {
    title: string;
    subtitle: string;
    showLogo: boolean;
    background: 'mesh' | 'gradient' | 'grid' | 'plain';
    cardStyle: 'glass' | 'solid' | 'outline';
    sideArt: boolean;
}

export interface AuroraThemeConfig {
    brand: AuroraBrand;
    colors: AuroraColors;
    appearance: AuroraAppearance;
    animations: AuroraAnimations;
    pixel: AuroraPixel;
    typography: AuroraTypography;
    login: AuroraLogin;
    _meta?: {
        theme: string;
        version: string;
        generatedAt: string;
    };
}

export interface AuroraPreset {
    key: string;
    label: string;
    description: string;
    /** Deep-partial config override applied over defaults. */
    config: DeepPartial<AuroraThemeConfig>;
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

declare global {
    interface Window {
        AuroraTheme?: AuroraThemeConfig;
    }
}
