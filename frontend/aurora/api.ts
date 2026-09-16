/**
 * Aurora Theme — client for the public theme config endpoint.
 *
 * Primary source is `window.AuroraTheme` (injected server-side into every
 * page, so first paint is already themed). This fetch is the fallback for
 * long-lived SPA sessions and for environments where injection is missing.
 */
import { AuroraThemeConfig, DeepPartial } from './types';
import { withDefaults } from './defaults';

let cache: AuroraThemeConfig | null = null;
let inflight: Promise<AuroraThemeConfig> | null = null;

export function getInjectedTheme(): DeepPartial<AuroraThemeConfig> | null {
    if (typeof window !== 'undefined' && window.AuroraTheme) {
        return window.AuroraTheme;
    }
    return null;
}

export function getThemeSync(): AuroraThemeConfig {
    if (cache) return cache;
    cache = withDefaults(getInjectedTheme() ?? undefined);
    return cache;
}

export function fetchThemeConfig(): Promise<AuroraThemeConfig> {
    const injected = getInjectedTheme();
    if (injected) {
        cache = withDefaults(injected);
        return Promise.resolve(cache);
    }
    if (cache) return Promise.resolve(cache);
    if (inflight) return inflight;

    inflight = fetch('/aurora/theme.json', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
    })
        .then((res) => {
            if (!res.ok) throw new Error(`Theme config request failed: ${res.status}`);
            return res.json();
        })
        .then((json) => {
            cache = withDefaults(json as DeepPartial<AuroraThemeConfig>);
            return cache;
        })
        .catch((err) => {
            // Offline / endpoint missing: fall back to built-in defaults so the
            // panel stays fully usable instead of rendering unstyled.
            // eslint-disable-next-line no-console
            console.warn('[aurora] Could not load theme config, using defaults.', err);
            cache = withDefaults(undefined);
            return cache;
        })
        .finally(() => {
            inflight = null;
        });

    return inflight;
}

export function clearThemeCache(): void {
    cache = null;
}
