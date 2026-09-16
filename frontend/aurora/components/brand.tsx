/**
 * Aurora Theme — brand logo + color-scheme switcher.
 */
import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useAurora } from '../ThemeContext';
import { Segmented } from './forms';

const LogoImg = styled.img<{ $size: number }>`
    width: ${(p) => p.$size}px;
    height: ${(p) => p.$size}px;
    object-fit: contain;
    border-radius: ${(p) => Math.min(10, Math.round(p.$size / 4))}px;
`;

/** Default Aurora mark (inline SVG pixel-comet, no external assets). */
export const AuroraMark: React.FC<{ size?: number; className?: string }> = ({ size = 32, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className={classNames('aurora-mark', className)}
        aria-hidden="true"
    >
        <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--aurora-primary)" opacity="0.16" />
        <rect x="7" y="7" width="6" height="6" fill="var(--aurora-primary)" />
        <rect x="13" y="7" width="12" height="6" fill="var(--aurora-secondary)" opacity="0.85" />
        <rect x="7" y="13" width="12" height="6" fill="var(--aurora-accent)" />
        <rect x="19" y="13" width="6" height="6" fill="var(--aurora-primary)" />
        <rect x="7" y="19" width="6" height="6" fill="var(--aurora-secondary)" />
        <rect x="13" y="19" width="6" height="6" fill="var(--aurora-primary)" opacity="0.7" />
    </svg>
);

export const BrandLogo: React.FC<{
    size?: number;
    showName?: boolean;
    name?: string;
    className?: string;
}> = ({ size = 32, showName = true, name, className }) => {
    let logoUrl = '';
    let brandName = '';
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { config } = useAurora();
        logoUrl = config.brand.logoUrl;
        brandName = name ?? config.brand.name;
    } catch {
        brandName = name ?? '';
    }

    return (
        <span className={classNames('aurora-brand', className)}>
            {logoUrl ? (
                <LogoImg src={logoUrl} alt={brandName || 'Panel logo'} $size={size} />
            ) : (
                <AuroraMark size={size} />
            )}
            {showName && brandName && <span className="aurora-brand-name">{brandName}</span>}
        </span>
    );
};

/** Light / dark / system switcher shown in the navigation when allowed. */
export const ThemeModeSwitcher: React.FC<{ compact?: boolean; className?: string }> = ({ compact, className }) => {
    const { userMode, setUserMode, config } = useAurora();
    if (!config.appearance.allowUserSwitch) return null;

    const value = userMode ?? 'system';

    if (compact) {
        return (
            <span className={classNames('aurora-mode-compact', className)}>
                <Segmented
                    ariaLabel="Color scheme"
                    value={value as 'light' | 'dark' | 'system'}
                    onChange={(v) => setUserMode(v === 'system' ? null : v)}
                    options={[
                        { value: 'light', label: <FontAwesomeIcon icon={faSun} />, title: 'Light mode' },
                        { value: 'system', label: <FontAwesomeIcon icon={faDesktop} />, title: 'Follow system' },
                        { value: 'dark', label: <FontAwesomeIcon icon={faMoon} />, title: 'Dark mode' },
                    ]}
                />
            </span>
        );
    }

    return (
        <span className={classNames('aurora-mode-switcher', className)}>
            <button
                type="button"
                onClick={() => setUserMode(userMode === 'dark' ? 'light' : userMode === 'light' ? null : 'dark')}
                className="aurora-mode-button"
                title={userMode ? `Color scheme: ${userMode} (click to change)` : 'Color scheme: system (click to change)'}
                aria-label="Toggle color scheme"
            >
                <FontAwesomeIcon icon={userMode === 'light' ? faSun : userMode === 'dark' ? faMoon : faDesktop} />
            </button>
        </span>
    );
};

export const TopBarBrand = styled.span`
    ${tw`inline-flex items-center gap-2 font-semibold`};
`;
