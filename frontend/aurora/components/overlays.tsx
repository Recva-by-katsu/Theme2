/**
 * Aurora Theme — modal, confirm dialog, drawer, dropdown.
 */
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { AuroraButton } from './Button';

const Overlay = styled.div`
    ${tw`fixed inset-0 z-50 flex items-center justify-center p-4`};
    background: var(--aurora-overlay);
    backdrop-filter: blur(3px);

    html[data-aurora-animations='1'] & {
        animation: aurora-fade-in var(--aurora-ms-fast) ease-out;
    }
`;

const Dialog = styled.div<{ $width: string }>`
    ${tw`w-full relative flex flex-col`};
    max-width: ${(p) => p.$width};
    max-height: calc(100vh - 4rem);
    background: var(--aurora-surface);
    border: 1px solid var(--aurora-border);
    border-radius: var(--aurora-radius);
    box-shadow: var(--aurora-shadow);

    html[data-aurora-animations='1'] & {
        animation: aurora-pop-in var(--aurora-ms-base) cubic-bezier(0.16, 1, 0.3, 1);
    }
`;

function useEscape(onClose: () => void) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
}

function useBodyLock(active: boolean) {
    useEffect(() => {
        if (!active) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [active]);
}

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: string;
    dismissable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    title,
    children,
    footer,
    width = '32rem',
    dismissable = true,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    useEscape(() => dismissable && onClose());
    useBodyLock(open);

    useEffect(() => {
        if (open) {
            // Move focus into the dialog for keyboard + screen-reader users.
            const t = window.setTimeout(() => dialogRef.current?.focus(), 30);
            return () => window.clearTimeout(t);
        }
        return undefined;
    }, [open ]);

    if (!open) return null;

    return ReactDOM.createPortal(
        <Overlay
            onMouseDown={(e) => {
                if (dismissable && e.target === e.currentTarget) onClose();
            }}
        >
            <Dialog
                ref={dialogRef}
                $width={width}
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === 'string' ? title : 'Dialog'}
                tabIndex={-1}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="aurora-modal-head">
                    {title && <h3 className="aurora-modal-title">{title}</h3>}
                    {dismissable && (
                        <button type="button" className="aurora-modal-close" onClick={onClose} aria-label="Close dialog">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    )}
                </div>
                <div className="aurora-modal-body">{children}</div>
                {footer && <div className="aurora-modal-foot">{footer}</div>}
            </Dialog>
        </Overlay>,
        document.body
    );
};

export const ConfirmDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    loading?: boolean;
    children: React.ReactNode;
}> = ({
    open,
    onClose,
    onConfirm,
    title,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = true,
    loading = false,
    children,
}) => (
    <Modal
        open={open}
        onClose={onClose}
        width="26rem"
        title={
            <span className="flex items-center gap-2">
                {danger && <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: 'var(--aurora-warning)' }} />}
                {title}
            </span>
        }
        footer={
            <>
                <AuroraButton variant="secondary" onClick={onClose} disabled={loading}>
                    {cancelLabel}
                </AuroraButton>
                <AuroraButton variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
                    {confirmLabel}
                </AuroraButton>
            </>
        }
    >
        <div className="aurora-confirm-body">{children}</div>
    </Modal>
);

// --- Drawer (slide-over panel) ---------------------------------------------------

const DrawerOverlay = styled(Overlay)`
    ${tw`justify-end p-0`};
`;

const DrawerPanel = styled.aside<{ $width: string }>`
    ${tw`h-full w-full flex flex-col`};
    max-width: ${(p) => p.$width};
    background: var(--aurora-surface);
    border-left: 1px solid var(--aurora-border);
    box-shadow: var(--aurora-shadow);

    html[data-aurora-animations='1'] & {
        animation: aurora-slide-in-right var(--aurora-ms-base) cubic-bezier(0.16, 1, 0.3, 1);
    }
`;

export const Drawer: React.FC<{
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    width?: string;
    children: React.ReactNode;
}> = ({ open, onClose, title, width = '24rem', children }) => {
    useEscape(onClose);
    useBodyLock(open);
    if (!open) return null;
    return ReactDOM.createPortal(
        <DrawerOverlay onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <DrawerPanel $width={width} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Panel'}>
                <div className="aurora-modal-head">
                    {title && <h3 className="aurora-modal-title">{title}</h3>}
                    <button type="button" className="aurora-modal-close" onClick={onClose} aria-label="Close panel">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="aurora-modal-body aurora-drawer-body">{children}</div>
            </DrawerPanel>
        </DrawerOverlay>,
        document.body
    );
};

// --- Simple dropdown menu -------------------------------------------------------

const MenuWrap = styled.div`
    ${tw`relative inline-block`};
`;

const MenuList = styled.div`
    ${tw`absolute right-0 mt-2 py-1 z-50 min-w-[12rem]`};
    background: var(--aurora-surface);
    border: 1px solid var(--aurora-border);
    border-radius: var(--aurora-radius-sm);
    box-shadow: var(--aurora-shadow);

    html[data-aurora-animations='1'] & {
        animation: aurora-pop-in var(--aurora-ms-fast) ease-out;
        transform-origin: top right;
    }
`;

export const Dropdown: React.FC<{
    label: React.ReactNode;
    children: React.ReactNode;
    ariaLabel?: string;
    className?: string;
}> = ({ label, children, ariaLabel, className }) => {
    const [open, setOpen] = React.useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const keys = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('keydown', keys);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('keydown', keys);
        };
    }, [open ]);

    return (
        <MenuWrap ref={ref} className={classNames('aurora-dropdown', className)}>
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={ariaLabel}
                onClick={() => setOpen((o) => !o)}
                className="aurora-dropdown-toggle"
            >
                {label}
            </button>
            {open && (
                <MenuList role="menu" onClick={() => setOpen(false)}>
                    {children}
                </MenuList>
            )}
        </MenuWrap>
    );
};

export const DropdownItem = styled.button`
    ${tw`flex items-center gap-2 w-full text-left px-3 py-2 text-sm cursor-pointer`};
    background: transparent;
    border: none;
    color: var(--aurora-text);
    &:hover {
        background: var(--aurora-primary-soft);
    }
    &:focus-visible {
        outline: 2px solid var(--aurora-accent);
        outline-offset: -2px;
    }
`;
