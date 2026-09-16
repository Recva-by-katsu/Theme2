/**
 * Aurora Theme — page headers, tabs, breadcrumbs, search.
 */
import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faSearch } from '@fortawesome/free-solid-svg-icons';

// --- Page header ---------------------------------------------------------------

const Header = styled.div`
    ${tw`flex flex-wrap items-start justify-between gap-3 mb-4`};
`;

export const PageHeader: React.FC<{
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}> = ({ title, subtitle, actions, className }) => (
    <Header className={classNames('aurora-page-header', className)}>
        <div className="min-w-0">
            <h1 className="aurora-h1">{title}</h1>
            {subtitle && <p className="aurora-page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </Header>
);

// --- Tabs ----------------------------------------------------------------------

const TabsWrap = styled.div`
    ${tw`flex gap-1 overflow-x-auto`};
    border-bottom: 1px solid var(--aurora-border);
    margin-bottom: 1rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
    ${tw`px-4 py-2.5 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors duration-150`};
    background: transparent;
    border: none;
    border-bottom: 2px solid ${(p) => (p.$active ? 'var(--aurora-primary)' : 'transparent')};
    color: ${(p) => (p.$active ? 'var(--aurora-text)' : 'var(--aurora-muted)')};
    margin-bottom: -1px;

    &:hover {
        color: var(--aurora-text);
    }
    &:focus-visible {
        outline: 2px solid var(--aurora-accent);
        outline-offset: -2px;
    }
`;

export function Tabs<T extends string>({
    tabs,
    active,
    onChange,
    ariaLabel,
}: {
    tabs: { value: T; label: React.ReactNode }[];
    active: T;
    onChange: (v: T) => void;
    ariaLabel?: string;
}) {
    return (
        <TabsWrap role="tablist" aria-label={ariaLabel} className="aurora-tabs">
            {tabs.map((t) => (
                <TabButton
                    key={t.value}
                    role="tab"
                    aria-selected={active === t.value}
                    $active={active === t.value}
                    onClick={() => onChange(t.value)}
                >
                    {t.label}
                </TabButton>
            ))}
        </TabsWrap>
    );
}

// --- Breadcrumbs ---------------------------------------------------------------

export const Breadcrumbs: React.FC<{
    items: { label: React.ReactNode; to?: string }[];
    className?: string;
}> = ({ items, className }) => (
    <nav aria-label="Breadcrumb" className={classNames('aurora-crumbs', className)}>
        <ol>
            {items.map((item, i) => (
                <li key={i}>
                    {i > 0 && <FontAwesomeIcon icon={faChevronRight} className="aurora-crumb-sep" />}
                    {item.to ? (
                        <Link to={item.to}>{item.label}</Link>
                    ) : (
                        <span aria-current="page">{item.label}</span>
                    )}
                </li>
            ))}
        </ol>
    </nav>
);

// --- Search box -----------------------------------------------------------------

const SearchWrap = styled.div`
    ${tw`relative flex items-center`};
    & > svg {
        ${tw`absolute left-3 pointer-events-none`};
        color: var(--aurora-muted);
        font-size: 0.85rem;
    }
`;

const SearchField = styled.input`
    ${tw`w-full`};
    background: var(--aurora-inset);
    border: 1px solid var(--aurora-border);
    border-radius: var(--aurora-radius-full);
    color: var(--aurora-text);
    font-size: 0.9rem;
    padding: 0.55rem 2.25rem 0.55rem 2.4rem;

    &::placeholder {
        color: var(--aurora-muted);
    }
    &:focus {
        outline: none;
        border-color: var(--aurora-primary);
        box-shadow: 0 0 0 3px var(--aurora-primary-soft);
    }
`;

export const SearchBox: React.FC<{
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    ariaLabel?: string;
    className?: string;
}> = ({ value, onChange, placeholder = 'Search…', ariaLabel, className }) => (
    <SearchWrap className={classNames('aurora-search', className)}>
        <FontAwesomeIcon icon={faSearch} />
        <SearchField
            type="search"
            role="searchbox"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={ariaLabel || placeholder}
        />
        {value && (
            <button
                type="button"
                aria-label="Clear search"
                className="aurora-search-clear"
                onClick={() => onChange('')}
            >
                ✕
            </button>
        )}
    </SearchWrap>
);
