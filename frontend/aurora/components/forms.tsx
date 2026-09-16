/**
 * Aurora Theme — form controls (standalone + Formik bindings).
 */
import React, { useState } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import classNames from 'classnames';
import { useField } from 'formik';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const inputBase = `
    width: 100%;
    background: var(--aurora-inset);
    border: 1px solid var(--aurora-border);
    border-radius: var(--aurora-radius-sm);
    color: var(--aurora-text);
    font-size: var(--aurora-font-size);
    padding: 0.625rem 0.875rem;
    line-height: 1.45;
    transition: border-color var(--aurora-ms-fast), box-shadow var(--aurora-ms-fast), background var(--aurora-ms-fast);

    &::placeholder { color: var(--aurora-muted); opacity: 0.8; }
    &:hover:not(:disabled) { border-color: var(--aurora-muted); }
    &:focus {
        outline: none;
        border-color: var(--aurora-primary);
        box-shadow: 0 0 0 3px var(--aurora-primary-soft);
        background: var(--aurora-card);
    }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
    html[data-aurora-animations='0'] & { transition: none; }
`;

export const AuroraInput = styled.input`
    ${inputBase}
`;

export const AuroraTextarea = styled.textarea`
    ${inputBase}
    min-height: 6rem;
    resize: vertical;
`;

export const AuroraSelect = styled.select`
    ${inputBase}
    appearance: none;
    padding-right: 2.25rem;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239aa6c7' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.8rem center;
    cursor: pointer;
`;

export const FieldLabel: React.FC<{ htmlFor?: string; children: React.ReactNode; optional?: boolean }> = ({
    htmlFor,
    children,
    optional,
}) => (
    <label htmlFor={htmlFor} className="aurora-label">
        {children}
        {optional && <span className="aurora-label-optional">optional</span>}
    </label>
);

export const FieldHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="aurora-hint">{children}</p>
);

export const FieldErrorText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="aurora-error-text" role="alert">
        {children}
    </p>
);

// --- Toggle switch ------------------------------------------------------------

const SwitchButton = styled.button<{ $checked: boolean; $disabled?: boolean }>`
    ${tw`relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-colors duration-150`};
    width: 2.6rem;
    height: 1.45rem;
    background: ${(p) => (p.$checked ? 'var(--aurora-primary)' : 'var(--aurora-elev-2)')};
    border: 1px solid ${(p) => (p.$checked ? 'var(--aurora-primary)' : 'var(--aurora-border)')};

    ${(p) => p.$disabled && tw`opacity-50 cursor-not-allowed`};

    &:focus-visible {
        outline: 2px solid var(--aurora-accent);
        outline-offset: 2px;
    }

    & > span {
        ${tw`inline-block rounded-full bg-white shadow`};
        width: 1.1rem;
        height: 1.1rem;
        margin: 0.13rem;
        transition: transform var(--aurora-ms-fast);
        transform: ${(p) => (p.$checked ? 'translateX(1.12rem)' : 'translateX(0)')};
    }
    html[data-aurora-animations='0'] & > span {
        transition: none;
    }
`;

export const Toggle: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    description?: React.ReactNode;
    disabled?: boolean;
    name?: string;
}> = ({ checked, onChange, label, description, disabled, name }) => (
    <label className={classNames('aurora-toggle', disabled && 'opacity-50')}>
        <SwitchButton
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={typeof label === 'string' ? label : name}
            $checked={checked}
            $disabled={disabled}
            disabled={disabled}
            onClick={(e) => {
                e.preventDefault();
                if (!disabled) onChange(!checked);
            }}
        >
            <span />
        </SwitchButton>
        {(label || description) && (
            <span className="aurora-toggle-text">
                {label && <span className="aurora-toggle-label">{label}</span>}
                {description && <span className="aurora-toggle-desc">{description}</span>}
            </span>
        )}
    </label>
);

// --- Formik-bound field (same behavior as panel Field, Aurora look) ------------

interface AuroraFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    name: string;
    label?: React.ReactNode;
    description?: React.ReactNode;
}

export const AuroraField: React.FC<AuroraFieldProps> = ({ label, description, ...props }) => {
    const [field, meta] = useField<string>(props.name);
    const showError = meta.touched && !!meta.error;
    return (
        <div className="aurora-field">
            {label && <FieldLabel htmlFor={props.id || props.name}>{label}</FieldLabel>}
            <AuroraInput
                id={props.id || props.name}
                {...field}
                {...props}
                aria-invalid={showError}
                aria-describedby={description ? `${props.name}-hint` : undefined}
                className={classNames(props.className, showError && 'aurora-input-error')}
            />
            {description && !showError && <span id={`${props.name}-hint`}><FieldHint>{description}</FieldHint></span>}
            {showError && <FieldErrorText>{meta.error}</FieldErrorText>}
        </div>
    );
};

export const AuroraPasswordField: React.FC<AuroraFieldProps> = ({ label, description, ...props }) => {
    const [field, meta] = useField<string>(props.name);
    const [visible, setVisible] = useState(false);
    const showError = meta.touched && !!meta.error;
    return (
        <div className="aurora-field">
            {label && <FieldLabel htmlFor={props.id || props.name}>{label}</FieldLabel>}
            <div className="relative">
                <AuroraInput
                    id={props.id || props.name}
                    {...field}
                    {...props}
                    type={visible ? 'text' : 'password'}
                    aria-invalid={showError}
                    className={classNames(props.className, showError && 'aurora-input-error', 'pr-11')}
                />
                <button
                    type="button"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    onClick={() => setVisible((v) => !v)}
                    className="aurora-password-toggle"
                >
                    <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
                </button>
            </div>
            {description && !showError && <FieldHint>{description}</FieldHint>}
            {showError && <FieldErrorText>{meta.error}</FieldErrorText>}
        </div>
    );
};

// --- Segmented control ---------------------------------------------------------

const SegmentWrap = styled.div`
    ${tw`inline-flex p-1 gap-1`};
    background: var(--aurora-inset);
    border: 1px solid var(--aurora-border);
    border-radius: var(--aurora-radius-sm);
`;

const SegmentButton = styled.button<{ $active: boolean }>`
    ${tw`px-3 py-1.5 text-sm font-medium cursor-pointer transition-all duration-150`};
    border-radius: calc(var(--aurora-radius-sm) - 3px);
    color: ${(p) => (p.$active ? 'var(--aurora-on-primary)' : 'var(--aurora-muted)')};
    background: ${(p) => (p.$active ? 'var(--aurora-primary)' : 'transparent')};
    border: none;
    &:hover:not(:disabled) {
        color: ${(p) => (p.$active ? 'var(--aurora-on-primary)' : 'var(--aurora-text)')};
    }
    &:focus-visible {
        outline: 2px solid var(--aurora-accent);
        outline-offset: 1px;
    }
`;

export function Segmented<T extends string>({
    options,
    value,
    onChange,
    ariaLabel,
}: {
    options: { value: T; label: React.ReactNode; title?: string }[];
    value: T;
    onChange: (v: T) => void;
    ariaLabel?: string;
}) {
    return (
        <SegmentWrap role="tablist" aria-label={ariaLabel}>
            {options.map((o) => (
                <SegmentButton
                    key={o.value}
                    type="button"
                    role="tab"
                    aria-selected={value === o.value}
                    title={o.title}
                    $active={value === o.value}
                    onClick={() => onChange(o.value)}
                >
                    {o.label}
                </SegmentButton>
            ))}
        </SegmentWrap>
    );
}
