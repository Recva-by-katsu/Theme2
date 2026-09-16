/**
 * Aurora Theme — console stat block (same props as stock).
 *
 * The stock `color` prop carries tailwind classes (bg-red-500 / bg-yellow-500
 * for alarm states); they are mapped to Aurora tones here.
 */
import React from 'react';
import Icon from '@/components/elements/Icon';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import useFitText from 'use-fit-text';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined;
    icon: IconDefinition;
    children: React.ReactNode;
    className?: string;
}

function toneFor(color?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
    if (!color) return 'primary';
    if (color.includes('red')) return 'danger';
    if (color.includes('yellow') || color.includes('amber') || color.includes('orange')) return 'warning';
    if (color.includes('green')) return 'success';
    if (color.includes('blue') || color.includes('cyan')) return 'info';
    return 'primary';
}

const toneVar: Record<string, string> = {
    primary: 'var(--aurora-primary)',
    success: 'var(--aurora-success)',
    warning: 'var(--aurora-warning)',
    danger: 'var(--aurora-danger)',
    info: 'var(--aurora-info)',
};

export default ({ title, copyOnClick, icon, color, className, children }: StatBlockProps) => {
    const { fontSize, ref } = useFitText({ minFontSize: 8, maxFontSize: 500 });
    const tone = toneFor(color);
    const toneColor = toneVar[tone];

    return (
        <CopyOnClick text={copyOnClick}>
            <div
                className={classNames('aurora-card', 'col-span-3 sm:col-span-2 lg:col-span-3 xl:col-span-2', className)}
                style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', overflow: 'hidden' }}
            >
                <span
                    aria-hidden="true"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.3rem',
                        height: '2.3rem',
                        flexShrink: 0,
                        borderRadius: 'var(--aurora-radius-sm)',
                        color: toneColor,
                        background: `color-mix(in srgb, ${toneColor} 15%, transparent)`,
                    }}
                >
                    <Icon icon={icon} style={{ width: '1.1rem', height: '1.1rem' }} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', width: '100%' }}>
                    <p className="aurora-stat-title">{title}</p>
                    <div
                        ref={ref}
                        style={{ fontSize, height: '1.75rem', width: '100%', fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
