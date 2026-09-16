/**
 * Aurora Theme — React provider.
 *
 * Reads the server-injected config synchronously (no theme flash), falls back
 * to /aurora/theme.json, resolves light/dark (admin default + OS + user
 * override), and applies design tokens via cssVars.
 *
 * Also exposes preview()/resetPreview() for live previews without reload.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuroraThemeConfig, DeepPartial } from './types';
import { deepMerge, withDefaults } from './defaults';
import { fetchThemeConfig, getThemeSync } from './api';
import {
    EffectiveMode,
    applyThemeToDocument,
    readUserMode,
    resolveEffectiveMode,
    writeUserMode,
} from './cssVars';

interface ThemeContextValue {
    config: AuroraThemeConfig;
    mode: EffectiveMode;
    userMode: 'light' | 'dark' | null;
    setUserMode: (mode: 'light' | 'dark' | null) => void;
    /** Temporarily preview a config patch (no reload, no persistence). */
    preview: (patch: DeepPartial<AuroraThemeConfig>) => void;
    resetPreview: () => void;
    isPreviewing: boolean;
    loading: boolean;
}

const AuroraContext = createContext<ThemeContextValue | null>(null);

export const AuroraThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AuroraThemeConfig>(() => getThemeSync());
    const [previewPatch, setPreviewPatch] = useState<DeepPartial<AuroraThemeConfig> | null>(null);
    const [userMode, setUserModeState] = useState<'light' | 'dark' | null>(() => readUserMode());
    const [osMode, setOsMode] = useState<EffectiveMode>(() =>
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark'
    );
    const [loading, setLoading] = useState(false);

    const effective = useMemo(
        () => (previewPatch ? deepMerge(config, previewPatch) : config),
        [config, previewPatch]
    );

    const mode = useMemo(
        () =>
            userMode && effective.appearance.allowUserSwitch
                ? userMode
                : effective.appearance.mode === 'system'
                ? osMode
                : effective.appearance.mode,
        [userMode, effective.appearance, osMode]
    );

    // Apply tokens whenever anything affecting visuals changes.
    useEffect(() => {
        applyThemeToDocument(effective, resolveEffectiveMode(effective, userMode));
    }, [effective, userMode, mode]);

    // React to OS-level color-scheme changes when in system mode.
    useEffect(() => {
        if (!window.matchMedia) return;
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const onChange = (e: MediaQueryListEvent) => setOsMode(e.matches ? 'light' : 'dark');
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', onChange);
            else mq.removeListener(onChange);
        };
    }, []);

    // Revalidate config from the server once (picks up admin changes in
    // long-lived SPA sessions without a reload).
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchThemeConfig()
            .then((fresh) => {
                if (!cancelled) setConfig(fresh);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const setUserMode = useCallback((m: 'light' | 'dark' | null) => {
        setUserModeState(m);
        writeUserMode(m);
    }, []);

    const preview = useCallback((patch: DeepPartial<AuroraThemeConfig>) => {
        setPreviewPatch(patch);
    }, []);

    const resetPreview = useCallback(() => setPreviewPatch(null), []);

    const value = useMemo<ThemeContextValue>(
        () => ({
            config: withDefaults(effective),
            mode,
            userMode,
            setUserMode,
            preview,
            resetPreview,
            isPreviewing: previewPatch !== null,
            loading,
        }),
        [effective, mode, userMode, setUserMode, preview, resetPreview, previewPatch, loading]
    );

    return <AuroraContext.Provider value={value}>{children}</AuroraContext.Provider>;
};

export function useAurora(): ThemeContextValue {
    const ctx = useContext(AuroraContext);
    if (!ctx) throw new Error('useAurora() must be used inside <AuroraThemeProvider>.');
    return ctx;
}

/** Lightweight hook for components that only need tokens (safe outside provider). */
export function useAuroraConfig(): AuroraThemeConfig {
    const ctx = useContext(AuroraContext);
    if (ctx) return ctx.config;
    return getThemeSync();
}
