/**
 * Aurora Theme — buttons.
 */
import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import classNames from 'classnames';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const Base = styled.button<{ $variant: Variant; $size: Size; $block: boolean }>`
    ${tw`inline-flex items-center justify-center font-medium select-none cursor-pointer no-underline transition-all duration-150 focus:outline-none`};
    border-radius: var(--aurora-radius-sm);
    font-size: var(--aurora-font-size);
    gap: 0.5rem;
    border: 1px solid transparent;
    position: relative;

    ${(p) => p.$block && tw`w-full`};

    ${(p) =>
        p.$size === 'xs'
            ? tw`px-2.5 py-1 text-xs`
            : p.$size === 'sm'
            ? tw`px-3 py-1.5 text-sm`
            : p.$size === 'lg'
            ? tw`px-5 py-2.5 text-base`
            : p.$size === 'xl'
            ? tw`px-6 py-3 text-base`
            : tw`px-4 py-2 text-sm`};

    &:disabled {
        ${tw`opacity-50 cursor-not-allowed`};
    }

    &:focus-visible {
        outline: 2px solid var(--aurora-accent);
        outline-offset: 2px;
    }

    html[data-aurora-animations='1'] & {
        transition-duration: var(--aurora-ms-fast);
    }
    html[data-aurora-animations='0'] & {
        transition: none;
    }
`;

const variantStyles: Record<Variant, ReturnType<typeof tw>> = {
    primary: tw`text-white`,
    secondary: tw``,
    ghost: tw``,
    danger: tw`text-white`,
    success: tw`text-white`,
    outline: tw``,
};

export interface AuroraButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    block?: boolean;
    loading?: boolean;
}

const StyledByVariant = styled(Base)<{ $variant: Variant }>`
    ${(p) => variantStyles[p.$variant]};
    ${(p) =>
        p.$variant === 'primary'
            ? `
        background: linear-gradient(180deg, var(--aurora-primary-strong), var(--aurora-primary));
        background-color: var(--aurora-primary);
        color: var(--aurora-on-primary);
        box-shadow: var(--aurora-shadow);
        html[data-aurora-animations='1'] &:not(:disabled):hover { filter: brightness(1.08); transform: translateY(-1px); }
        html[data-aurora-animations='1'] &:not(:disabled):active { transform: translateY(0); filter: brightness(0.97); }
        &:not(:disabled):hover { filter: brightness(1.08); }
    `
            : p.$variant === 'secondary'
            ? `
        background: var(--aurora-elev-2);
        color: var(--aurora-text);
        border-color: var(--aurora-border);
        &:not(:disabled):hover { background: var(--aurora-card); border-color: var(--aurora-primary); }
    `
            : p.$variant === 'ghost'
            ? `
        background: transparent;
        color: var(--aurora-muted);
        &:not(:disabled):hover { color: var(--aurora-text); background: var(--aurora-primary-soft); }
    `
            : p.$variant === 'danger'
            ? `
        background: var(--aurora-danger);
        color: #fff;
        &:not(:disabled):hover { filter: brightness(1.1); }
    `
            : p.$variant === 'success'
            ? `
        background: var(--aurora-success);
        color: #fff;
        &:not(:disabled):hover { filter: brightness(1.08); }
    `
            : `
        background: transparent;
        color: var(--aurora-primary);
        border-color: var(--aurora-primary);
        &:not(:disabled):hover { background: var(--aurora-primary-soft); }
    `}
`;

export const AuroraButton = React.forwardRef<HTMLButtonElement, AuroraButtonProps>(
    ({ variant = 'primary', size = 'md', block = false, loading = false, children, disabled, className, type = 'button', ...rest }, ref) => (
        <StyledByVariant
            ref={ref}
            type={type}
            $variant={variant}
            $size={size}
            $block={block}
            disabled={disabled || loading}
            className={classNames('aurora-btn', `aurora-btn-${variant}`, className)}
            {...rest}
        >
            {loading && (
                <span className="aurora-btn-spinner" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </span>
            )}
            {children}
        </StyledByVariant>
    )
);
AuroraButton.displayName = 'AuroraButton';

export const IconButton = styled.button<{ $active?: boolean }>`
    ${tw`inline-flex items-center justify-center w-9 h-9 cursor-pointer transition-all duration-150`};
    border-radius: var(--aurora-radius-sm);
    background: transparent;
    border: 1px solid transparent;
    color: var(--aurora-muted);

    &:hover:not(:disabled) {
        color: var(--aurora-text);
        background: var(--aurora-primary-soft);
        border-color: var(--aurora-border);
    }
    &:disabled {
        ${tw`opacity-40 cursor-not-allowed`};
    }
    &:focus-visible {
        outline: 2px solid var(--aurora-accent);
        outline-offset: 2px;
    }
    ${(p) =>
        p.$active &&
        `
        color: var(--aurora-primary);
        background: var(--aurora-primary-soft);
        border-color: var(--aurora-primary);
    `}
`;
