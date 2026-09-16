/**
 * Aurora Theme — toast notification system.
 *
 * A lightweight toaster that complements (not replaces) the panel's flash
 * system. Used by Aurora components for success/error/info feedback.
 */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faExclamationCircle,
    faExclamationTriangle,
    faInfoCircle,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: number;
    type: ToastType;
    title?: string;
    message: React.ReactNode;
}

interface ToastContextValue {
    notify: (type: ToastType, message: React.ReactNode, title?: string, timeoutMs?: number) => void;
    success: (message: React.ReactNode, title?: string) => void;
    error: (message: React.ReactNode, title?: string) => void;
    warning: (message: React.ReactNode, title?: string) => void;
    info: (message: React.ReactNode, title?: string) => void;
    dismiss: (id: number) => void;
}

const Ctx = createContext<ToastContextValue | null>(null);

const Stack = styled.div`
    ${tw`fixed z-[100] flex flex-col gap-2 items-end`};
    right: 1rem;
    bottom: 1rem;
    max-width: min(24rem, calc(100vw - 2rem));

    @media (max-width: 640px) {
        left: 1rem;
        right: 1rem;
        align-items: stretch;
    }
`;

const Card = styled.div<{ $type: ToastType }>`
    ${tw`flex items-start gap-3 w-full`};
    background: var(--aurora-surface);
    border: 1px solid var(--aurora-border);
    border-left: 3px solid
        ${(p) =>
            p.$type === 'success'
                ? 'var(--aurora-success)'
                : p.$type === 'error'
                ? 'var(--aurora-danger)'
                : p.$type === 'warning'
                ? 'var(--aurora-warning)'
                : 'var(--aurora-info)'};
    border-radius: var(--aurora-radius-sm);
    box-shadow: var(--aurora-shadow);
    padding: 0.75rem 0.9rem;
    color: var(--aurora-text);

    html[data-aurora-animations='1'] & {
        animation: aurora-toast-in var(--aurora-ms-base) cubic-bezier(0.16, 1, 0.3, 1);
    }
`;

const icons = {
    success: faCheckCircle,
    error: faExclamationCircle,
    warning: faExclamationTriangle,
    info: faInfoCircle,
} as const;

const iconColors: Record<ToastType, string> = {
    success: 'var(--aurora-success)',
    error: 'var(--aurora-danger)',
    warning: 'var(--aurora-warning)',
    info: 'var(--aurora-info)',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<ToastItem[]>([]);
    const nextId = useRef(1);

    const dismiss = useCallback((id: number) => {
        setItems((list) => list.filter((t) => t.id !== id));
    }, []);

    const notify = useCallback(
        (type: ToastType, message: React.ReactNode, title?: string, timeoutMs = 5000) => {
            const id = nextId.current++;
            setItems((list) => [...list.slice(-4), { id, type, title, message }]);
            if (timeoutMs > 0) {
                window.setTimeout(() => dismiss(id), timeoutMs);
            }
        },
        [dismiss]
    );

    const value = useMemo<ToastContextValue>(
        () => ({
            notify,
            success: (message, title) => notify('success', message, title),
            error: (message, title) => notify('error', message, title),
            warning: (message, title) => notify('warning', message, title),
            info: (message, title) => notify('info', message, title),
            dismiss,
        }),
        [notify, dismiss]
    );

    return (
        <Ctx.Provider value={value}>
            {children}
            {ReactDOM.createPortal(
                <Stack aria-live="polite" aria-atomic="false">
                    {items.map((t) => (
                        <Card key={t.id} $type={t.type} role="status">
                            <FontAwesomeIcon icon={icons[t.type]} style={{ color: iconColors[t.type] }} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                                {t.title && <p className="font-semibold text-sm">{t.title}</p>}
                                <div className="text-sm leading-snug">{t.message}</div>
                            </div>
                            <button
                                type="button"
                                aria-label="Dismiss notification"
                                onClick={() => dismiss(t.id)}
                                className="aurora-toast-close"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </Card>
                    ))}
                </Stack>,
                document.body
            )}
        </Ctx.Provider>
    );
};

export function useAuroraToast(): ToastContextValue {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useAuroraToast() must be used inside <ToastProvider>.');
    return ctx;
}
