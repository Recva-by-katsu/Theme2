/**
 * Aurora Theme — design-token engine.
 *
 * Translates the theme config into CSS custom properties on :root, plus
 * data-attributes consumed by aurora.css for fonts, radius, shadows,
 * animations, pixel accents and density.
 *
 * Single source of truth for "config → visuals" on the frontend.
 */
import { AuroraThemeConfig } from './types';

export const USER_MODE_KEY = 'aurora:color-scheme';

export type EffectiveMode = 'light' | 'dark';

const FONT_STACKS: Record<string, string> = {
    system: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    plex: "'IBM Plex Sans', 'Roboto', system-ui, sans-serif",
    inter: "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    rounded: "ui-rounded, 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', 'Segoe UI', system-ui, sans-serif",
};

const SHADOWS: Record<string, string> = {
    none: 'none',
    soft: '0 1px 2px rgba(2, 6, 23, 0.28), 0 4px 16px -4px rgba(2, 6, 23, 0.3)',
    medium: '0 2px 6px rgba(2, 6, 23, 0.32), 0 12px 32px -8px rgba(2, 6, 23, 0.45)',
    strong: '0 4px 12px rgba(2, 6, 23, 0.4), 0 24px 48px -12px rgba(2, 6, 23, 0.55)',
};

const INTENSITY_MS: Record<string, { fast: number; base: number; slow: number }> = {
    subtle: { fast: 90, base: 140, slow: 200 },
    normal: { fast: 120, base: 200, slow: 320 },
    playful: { fast: 140, base: 260, slow: 420 },
};

function hexToRgb(hex: string): [number, number, number] {
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h
            .split('')
            .map((c) => c + c)
            .join('');
    }
    const n = parseInt(h.slice(0, 6), 16);
    if (Number.isNaN(n)) return [79, 124, 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, alpha: number): string {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mix(hexA: string, hexB: string, weightA: number): string {
    const [r1, g1, b1] = hexToRgb(hexA);
    const [r2, g2, b2] = hexToRgb(hexB);
    const w = Math.min(1, Math.max(0, weightA));
    const r = Math.round(r1 * w + r2 * (1 - w));
    const g = Math.round(g1 * w + g2 * (1 - w));
    const b = Math.round(b1 * w + b2 * (1 - w));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function resolveEffectiveMode(
    config: AuroraThemeConfig,
    userOverride: 'light' | 'dark' | null
): EffectiveMode {
    if (userOverride && config.appearance.allowUserSwitch) return userOverride;
    const mode = config.appearance.mode;
    if (mode === 'light' || mode === 'dark') return mode;
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
}

export function readUserMode(): 'light' | 'dark' | null {
    try {
        const v = window.localStorage.getItem(USER_MODE_KEY);
        return v === 'light' || v === 'dark' ? v : null;
    } catch {
        return null;
    }
}

export function writeUserMode(mode: 'light' | 'dark' | null): void {
    try {
        if (mode) window.localStorage.setItem(USER_MODE_KEY, mode);
        else window.localStorage.removeItem(USER_MODE_KEY);
    } catch {
        /* storage unavailable — ignore */
    }
}

/**
 * Light-mode surface derivation. Admins design one palette (dark-first);
 * light mode keeps brand colors and derives accessible light surfaces.
 */
function lightSurfaces(config: AuroraThemeConfig) {
    return {
        background: '#eef1f8',
        surface: '#ffffff',
        card: '#ffffff',
        text: '#0e1526',
        muted: '#5b6478',
        border: '#dde3f0',
    };
}

export function applyThemeToDocument(config: AuroraThemeConfig, mode: EffectiveMode): void {
    const root = document.documentElement;
    const c = config.colors;
    const surfaces = mode === 'light' ? lightSurfaces(config) : null;

    const bg = surfaces?.background ?? c.background;
    const surface = surfaces?.surface ?? c.surface;
    const card = surfaces?.card ?? c.card;
    const text = surfaces?.text ?? c.text;
    const muted = surfaces?.muted ?? c.muted;
    const border = surfaces?.border ?? c.border;

    const vars: Record<string, string> = {
        '--aurora-primary': c.primary,
        '--aurora-secondary': c.secondary,
        '--aurora-accent': c.accent,
        '--aurora-bg': bg,
        '--aurora-surface': surface,
        '--aurora-card': card,
        '--aurora-text': text,
        '--aurora-muted': muted,
        '--aurora-border': border,
        '--aurora-success': c.success,
        '--aurora-warning': c.warning,
        '--aurora-danger': c.danger,
        '--aurora-info': c.info,
        // Derived helpers
        '--aurora-primary-soft': rgba(c.primary, mode === 'light' ? 0.12 : 0.16),
        '--aurora-primary-strong': mix(c.primary, mode === 'light' ? '#000000' : '#ffffff', 0.85),
        '--aurora-accent-soft': rgba(c.accent, 0.14),
        '--aurora-danger-soft': rgba(c.danger, 0.14),
        '--aurora-success-soft': rgba(c.success, 0.14),
        '--aurora-warning-soft': rgba(c.warning, 0.16),
        '--aurora-info-soft': rgba(c.info, 0.14),
        '--aurora-elev-1': mode === 'light' ? '#ffffff' : mix(card, '#ffffff', 0.94),
        '--aurora-elev-2': mode === 'light' ? '#f6f8fc' : mix(card, '#ffffff', 0.88),
        '--aurora-inset': mode === 'light' ? '#e8edf5' : 'rgba(0, 0, 0, 0.28)',
        '--aurora-overlay': mode === 'light' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(2, 6, 23, 0.66)',
        '--aurora-on-primary': '#ffffff',
        // Geometry
        '--aurora-radius': `${config.appearance.radius}px`,
        '--aurora-radius-sm': `${Math.max(4, Math.round(config.appearance.radius * 0.55))}px`,
        '--aurora-radius-lg': `${Math.round(config.appearance.radius * 1.4)}px`,
        '--aurora-radius-full': '9999px',
        '--aurora-shadow': SHADOWS[config.appearance.shadow] ?? SHADOWS.soft,
        // Typography
        '--aurora-font': FONT_STACKS[config.typography.fontFamily] ?? FONT_STACKS.system,
        '--aurora-font-size': `${config.typography.baseSize}px`,
        '--aurora-heading-scale': String(config.typography.headingScale),
        '--aurora-font-weight': config.typography.weight,
        '--aurora-line-height': String(config.typography.lineHeight),
        // Motion
        '--aurora-ms-fast': `${INTENSITY_MS[config.animations.intensity]?.fast ?? 120}ms`,
        '--aurora-ms-base': `${INTENSITY_MS[config.animations.intensity]?.base ?? 200}ms`,
        '--aurora-ms-slow': `${INTENSITY_MS[config.animations.intensity]?.slow ?? 320}ms`,
        // Density
        '--aurora-pad': config.appearance.compact ? '0.75rem' : '1rem',
        '--aurora-gap': config.appearance.dense ? '0.5rem' : config.appearance.compact ? '0.75rem' : '1rem',
    };

    for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value);
    }

    // Data attributes consumed by aurora.css.
    root.dataset.auroraMode = mode;
    root.dataset.auroraFont = config.typography.fontFamily;
    root.dataset.auroraShadow = config.appearance.shadow;
    root.dataset.auroraSidebar = config.appearance.sidebarStyle;
    root.dataset.auroraCompact = config.appearance.compact ? '1' : '0';
    root.dataset.auroraDense = config.appearance.dense ? '1' : '0';
    root.dataset.auroraAnimations = config.animations.enabled ? '1' : '0';
    root.dataset.auroraBgFx = config.animations.enabled && config.animations.backgroundEffects ? '1' : '0';
    root.dataset.auroraPixel = config.pixel.enabled ? config.pixel.intensity : 'off';
    root.dataset.auroraPixelIcons = config.pixel.enabled && config.pixel.pixelIcons ? '1' : '0';
    root.dataset.auroraLoginBg = config.login.background;
    root.dataset.auroraLoginCard = config.login.cardStyle;
    root.dataset.auroraLoading = config.animations.loadingStyle;
    root.style.colorScheme = mode;

    // Keep the browser chrome in sync (mobile address bar etc).
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
    }
    meta.content = bg;

    // Favicon override (admin-configured).
    if (config.brand.faviconUrl) {
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-aurora]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            link.dataset.aurora = '1';
            document.head.appendChild(link);
        }
        link.href = config.brand.faviconUrl;
    }

    document.title = config.brand.name || document.title;
}
