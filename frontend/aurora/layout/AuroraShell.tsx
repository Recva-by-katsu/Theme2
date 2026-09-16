/**
 * Aurora Theme — application shell (top bar + sidebar + mobile navigation).
 *
 * Used by the Aurora DashboardRouter / ServerRouter. Preserves all stock
 * behaviors (logout flow, admin/account links, global search) with a new
 * premium layout: sticky glass top bar, floating sidebar, slide-over menu
 * on mobile, and a light/dark/system switcher.
 */
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faChevronLeft,
    faCogs,
    faHome,
    faSignOutAlt,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';
import classNames from 'classnames';
import { useAuroraConfig } from '../ThemeContext';
import { ThemeModeSwitcher, AuroraMark } from '../components/brand';

const COLLAPSE_KEY = 'aurora:sidebar-collapsed';

// --- Top bar -------------------------------------------------------------------

export const AuroraTopBar: React.FC<{
    onMenuToggle?: () => void;
    menuOpen?: boolean;
    hasSidebar?: boolean;
}> = ({ onMenuToggle, menuOpen, hasSidebar }) => {
    const config = useAuroraConfig();
    const panelName = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const brandName = config.brand.name || panelName;

    return (
        <header className="aurora-nav">
            <SpinnerOverlay visible={isLoggingOut} />
            <div className="aurora-nav-inner">
                {hasSidebar && (
                    <button
                        type="button"
                        className="aurora-nav-icon aurora-hamburger"
                        onClick={onMenuToggle}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={!!menuOpen}
                    >
                        <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
                    </button>
                )}
                <Link to="/" className="aurora-nav-brand" aria-label="Dashboard home">
                    {config.brand.logoUrl ? (
                        <img
                            src={config.brand.logoUrl}
                            alt=""
                            style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 8 }}
                        />
                    ) : (
                        <AuroraMark size={30} />
                    )}
                    <span className="aurora-brand-name">{brandName}</span>
                </Link>
                <div className="aurora-nav-actions">
                    <span className="aurora-nav-search">
                        <SearchContainer />
                    </span>
                    <ThemeModeSwitcher />
                    <Tooltip placement="bottom" content="Dashboard">
                        <NavLink to="/" exact className="aurora-nav-icon" activeClassName="active" aria-label="Dashboard">
                            <FontAwesomeIcon icon={faHome} />
                        </NavLink>
                    </Tooltip>
                    {rootAdmin && (
                        <Tooltip placement="bottom" content="Admin">
                            <a href="/admin" rel="noreferrer" className="aurora-nav-icon" aria-label="Admin panel">
                                <FontAwesomeIcon icon={faCogs} />
                            </a>
                        </Tooltip>
                    )}
                    <Tooltip placement="bottom" content="Account Settings">
                        <NavLink
                            to="/account"
                            className="aurora-nav-icon"
                            activeClassName="active"
                            aria-label="Account settings"
                        >
                            <span style={{ display: 'flex', width: '1.4rem', height: '1.4rem' }}>
                                <Avatar.User />
                            </span>
                        </NavLink>
                    </Tooltip>
                    <Tooltip placement="bottom" content="Sign Out">
                        <button type="button" className="aurora-nav-icon" onClick={onTriggerLogout} aria-label="Sign out">
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </header>
    );
};

// --- Sidebar primitives ----------------------------------------------------------

export const SideSection: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        {title && <p className="aurora-side-heading">{title}</p>}
        {children}
    </div>
);

export const SideLink: React.FC<{
    to: string;
    exact?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
    onNavigate?: () => void;
}> = ({ to, exact, icon, children, onNavigate }) => (
    <NavLink
        to={to}
        exact={exact}
        className="aurora-side-link"
        activeClassName="active"
        onClick={onNavigate}
    >
        {icon}
        <span>{children}</span>
    </NavLink>
);

export const SideExternal: React.FC<{ href: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
    href,
    icon,
    children,
}) => (
    <a href={href} className="aurora-side-link" target="_blank" rel="noreferrer">
        {icon}
        <span>{children}</span>
    </a>
);

// --- Shell ------------------------------------------------------------------------

export const AuroraShell: React.FC<{
    sidebar?: React.ReactNode;
    children: React.ReactNode;
}> = ({ sidebar, children }) => {
    const config = useAuroraConfig();
    const location = useLocation();
    const topMode = config.appearance.sidebarStyle === 'top';

    const [menuOpen, setMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            const stored = window.localStorage.getItem(COLLAPSE_KEY);
            if (stored !== null) return stored === '1';
        } catch {
            /* ignore */
        }
        return config.appearance.sidebarCollapsed;
    });

    // Close the mobile drawer on navigation.
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Lock body scroll while the mobile drawer is open.
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    const toggleCollapsed = () => {
        setCollapsed((c) => {
            try {
                window.localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
            } catch {
                /* ignore */
            }
            return !c;
        });
    };

    const hasSidebar = !!sidebar && !topMode;

    return (
        <>
            <AuroraTopBar
                hasSidebar={hasSidebar}
                menuOpen={menuOpen}
                onMenuToggle={() => setMenuOpen((o) => !o)}
            />
            <div className={classNames('aurora-shell', collapsed && hasSidebar && 'collapsed', menuOpen && 'nav-open')}>
                {hasSidebar && (
                    <aside className="aurora-sidebar" aria-label="Section navigation">
                        <div className="aurora-sidebar-inner">
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {sidebar}
                            </div>
                            <button
                                type="button"
                                onClick={toggleCollapsed}
                                className="aurora-side-link aurora-collapse-btn"
                                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                style={{ marginTop: '0.5rem' }}
                            >
                                <FontAwesomeIcon
                                    icon={faChevronLeft}
                                    style={{ transform: collapsed ? 'rotate(180deg)' : undefined }}
                                />
                                <span>{collapsed ? 'Expand' : 'Collapse'}</span>
                            </button>
                        </div>
                    </aside>
                )}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div className="aurora-sidebar-scrim" onClick={() => setMenuOpen(false)} />
                <main className="aurora-main">
                    <div className="aurora-container">{children}</div>
                </main>
            </div>
        </>
    );
};

/** Pill sub-navigation used when the sidebar is in "top" mode. */
export const AuroraPills: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <nav className="aurora-subnav" aria-label="Section navigation">
        {children}
    </nav>
);
