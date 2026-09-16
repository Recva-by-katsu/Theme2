/**
 * Aurora Theme — badges, alerts, empty states, skeletons, loaders.
 */
import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faExclamationCircle,
    faExclamationTriangle,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

// --- Badge --------------------------------------------------------------------

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const toneVar: Record<Tone, string> = {
    primary: 'var(--aurora-primary)',
    success: 'var(--aurora-success)',
    warning: 'var(--aurora-warning)',
    danger: 'var(--aurora-danger)',
    info: 'var(--aurora-info)',
    muted: 'var(--aurora-muted)',
};

const BadgeWrap = styled.span<{ $tone: Tone; $soft: boolean }>`
    ${tw`inline-flex items-center gap-1 font-medium whitespace-nowrap`};
    font-size: 0.72rem;
    padding: 0.2rem 0.6rem;
    border-radius: var(--aurora-radius-full);
    line-height: 1.3;

    ${(p) =>
        p.$soft
            ? `
        color: ${toneVar[p.$tone]};
        background: color-mix(in srgb, ${toneVar[p.$tone]} 14%, transparent);
        border: 1px solid color-mix(in srgb, ${toneVar[p.$tone]} 35%, transparent);
    `
            : `
        color: #fff;
        background: ${toneVar[p.$tone]};
    `}
`;

export const Badge: React.FC<{
    tone?: Tone;
    soft?: boolean;
    dot?: boolean;
    className?: string;
    children: React.ReactNode;
}> = ({ tone = 'primary', soft = true, dot = false, className, children }) => (
    <BadgeWrap $tone={tone} $soft={soft} className={classNames('aurora-badge', className)}>
        {dot && <StatusDot tone={tone} pulse={tone === 'success'} />}
        {children}
    </BadgeWrap>
);

export const StatusDot = styled.span<{ tone?: Tone; pulse?: boolean }>`
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background: ${(p) => toneVar[p.tone ?? 'muted']};
    ${(p) =>
        p.pulse
            ? `
        html[data-aurora-animations='1'] & { animation: aurora-pulse 2s ease-in-out infinite; }
    `
            : ''}
`;

// --- Alert --------------------------------------------------------------------

const alertIcon = {
    success: faCheckCircle,
    error: faExclamationCircle,
    warning: faExclamationTriangle,
    info: faInfoCircle,
} as const;

const AlertWrap = styled.div<{ $type: keyof typeof alertIcon }>`
    ${tw`flex items-start gap-3`};
    padding: 0.8rem 1rem;
    border-radius: var(--aurora-radius-sm);
    font-size: 0.9rem;
    line-height: 1.5;
    border: 1px solid;

    ${(p) => {
        const v = toneVar[p.$type === 'error' ? 'danger' : p.$type];
        return `
            color: var(--aurora-text);
            background: color-mix(in srgb, ${v} 10%, var(--aurora-card));
            border-color: color-mix(in srgb, ${v} 40%, transparent);
            & .aurora-alert-icon { color: ${v}; }
        `;
    }}
`;

export const Alert: React.FC<{
    type: keyof typeof alertIcon;
    title?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
    onDismiss?: () => void;
}> = ({ type, title, className, children, onDismiss }) => (
    <AlertWrap $type={type} role={type === 'error' ? 'alert' : 'status'} className={classNames('aurora-alert', className)}>
        <FontAwesomeIcon icon={alertIcon[type]} className="aurora-alert-icon mt-0.5" />
        <div className="flex-1 min-w-0">
            {title && <p className="font-semibold mb-0.5">{title}</p>}
            <div>{children}</div>
        </div>
        {onDismiss && (
            <button type="button" onClick={onDismiss} aria-label="Dismiss" className="aurora-alert-dismiss">
                ✕
            </button>
        )}
    </AlertWrap>
);

// --- Empty state ---------------------------------------------------------------

const EmptyWrap = styled.div`
    ${tw`flex flex-col items-center justify-center text-center`};
    padding: 3rem 1.5rem;
    background: var(--aurora-card);
    border: 1px dashed var(--aurora-border);
    border-radius: var(--aurora-radius);
`;

export const EmptyState: React.FC<{
    icon?: React.ReactNode;
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}> = ({ icon, title, description, action, className }) => (
    <EmptyWrap className={classNames('aurora-empty', className)}>
        {icon && <div className="aurora-empty-icon">{icon}</div>}
        <h3 className="aurora-empty-title">{title}</h3>
        {description && <p className="aurora-empty-desc">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
    </EmptyWrap>
);

// --- Skeletons & loaders --------------------------------------------------------

export const Skeleton: React.FC<{
    className?: string;
    width?: string | number;
    height?: string | number;
    rounded?: boolean;
    style?: React.CSSProperties;
}> = ({ className, width, height, rounded, style }) => (
    <span
        aria-hidden="true"
        className={classNames('aurora-skeleton', rounded && 'aurora-skeleton-rounded', className)}
        style={{ width, height, ...style }}
    />
);

export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className }) => (
    <div className={classNames('aurora-skeleton-card', className)} aria-hidden="true">
        <Skeleton height={18} width="45%" />
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} height={12} width={`${92 - i * 14}%`} />
        ))}
    </div>
);

export const DotsLoader: React.FC<{ label?: string }> = ({ label }) => (
    <span className="aurora-dots" role="status" aria-label={label || 'Loading'}>
        <span />
        <span />
        <span />
    </span>
);

export const SpinnerLoader: React.FC<{ label?: string; size?: number }> = ({ label, size = 32 }) => (
    <span
        className="aurora-spinner"
        role="status"
        aria-label={label || 'Loading'}
        style={{ width: size, height: size }}
    />
);

/** Picks the configured loading visual (skeleton / spinner / dots). */
export const LoadingVisual: React.FC<{ style?: 'skeleton' | 'spinner' | 'dots'; label?: string }> = ({
    style,
    label,
}) => {
    const resolved =
        style ?? (document.documentElement.dataset.auroraLoading as 'skeleton' | 'spinner' | 'dots') ?? 'skeleton';
    if (resolved === 'dots') return <DotsLoader label={label} />;
    if (resolved === 'spinner') return <SpinnerLoader label={label} />;
    return (
        <span className="aurora-loading-block" role="status" aria-label={label || 'Loading'}>
            <Skeleton height={14} width="60%" />
            <Skeleton height={14} width="85%" />
            <Skeleton height={14} width="40%" />
        </span>
    );
};
