/**
 * Aurora Theme — cards & stat cards.
 */
import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import classNames from 'classnames';

export const AuroraCard = styled.div<{ $hover?: boolean; $pad?: boolean; $pixel?: boolean }>`
    background: var(--aurora-card);
    border: 1px solid var(--aurora-border);
    border-radius: var(--aurora-radius);
    box-shadow: var(--aurora-shadow);
    color: var(--aurora-text);
    ${(p) => (p.$pad === false ? '' : 'padding: var(--aurora-pad);')}

    ${(p) =>
        p.$hover &&
        `
        html[data-aurora-animations='1'] & {
            transition: transform var(--aurora-ms-fast), box-shadow var(--aurora-ms-fast), border-color var(--aurora-ms-fast);
        }
        &:hover {
            border-color: var(--aurora-primary);
            html[data-aurora-animations='1'] & { transform: translateY(-2px); }
        }
    `}
`;

export const CardHeader: React.FC<{
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}> = ({ title, subtitle, action, className }) => (
    <div className={classNames('flex items-start justify-between gap-3 mb-3', className)}>
        <div className="min-w-0">
            <h3 className="aurora-card-title">{title}</h3>
            {subtitle && <p className="aurora-card-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
    </div>
);

// --- Stat card ---------------------------------------------------------------

const Stat = styled(AuroraCard)`
    ${tw`relative overflow-hidden`};
    .aurora-stat-icon {
        ${tw`flex items-center justify-center rounded-lg`};
        width: 2.4rem;
        height: 2.4rem;
        background: var(--aurora-primary-soft);
        color: var(--aurora-primary);
        font-size: 1.05rem;
    }
`;

export const StatCard: React.FC<{
    title: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    icon?: React.ReactNode;
    tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    className?: string;
    onClick?: () => void;
}> = ({ title, value, sub, icon, tone = 'primary', className, onClick }) => {
    const tones: Record<string, string> = {
        primary: 'var(--aurora-primary)',
        success: 'var(--aurora-success)',
        warning: 'var(--aurora-warning)',
        danger: 'var(--aurora-danger)',
        info: 'var(--aurora-info)',
    };
    const color = tones[tone];
    return (
        <Stat
            $hover={!!onClick}
            onClick={onClick}
            className={classNames(className)}
            style={onClick ? { cursor: 'pointer' } : undefined}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ' ? onClick() : undefined) : undefined}
        >
            <div className="flex items-center gap-3">
                {icon && (
                    <span className="aurora-stat-icon" style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
                        {icon}
                    </span>
                )}
                <div className="min-w-0">
                    <p className="aurora-stat-title">{title}</p>
                    <p className="aurora-stat-value">{value}</p>
                    {sub && <p className="aurora-stat-sub">{sub}</p>}
                </div>
            </div>
        </Stat>
    );
};
