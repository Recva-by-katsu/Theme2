/**
 * Aurora Theme — dashboard router.
 *
 * Same routing behavior as stock (dashboard, account pages, 404) inside the
 * Aurora shell: sidebar navigation on desktop, slide-over menu on mobile,
 * pill navigation when the admin selects the "top" sidebar style.
 */
import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCogs,
    faHistory,
    faHome,
    faKey,
    faPalette,
    faTerminal,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { AuroraPills, AuroraShell, SideExternal, SideLink, SideSection } from '@/aurora/layout/AuroraShell';
import { useAuroraConfig } from '@/aurora/ThemeContext';

const ACCOUNT_ICONS: Record<string, typeof faUser> = {
    '/': faUser,
    '/api': faKey,
    '/ssh': faTerminal,
    '/activity': faHistory,
};

export default () => {
    const location = useLocation();
    const config = useAuroraConfig();
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const username = useStoreState((state: ApplicationStore) => state.user.data!.username);

    const topMode = config.appearance.sidebarStyle === 'top';
    const onAccount = location.pathname.startsWith('/account');

    const accountLinks = routes.account
        .filter((route) => !!route.name)
        .map(({ path, name, exact = false }) => ({ path, name: name as string, exact }));

    const sidebar = (
        <>
            <SideSection title="Menu">
                <SideLink to="/" exact icon={<FontAwesomeIcon icon={faHome} fixedWidth />}>
                    Dashboard
                </SideLink>
            </SideSection>
            <SideSection title="Account">
                {accountLinks.map(({ path, name, exact }) => (
                    <SideLink
                        key={path}
                        to={`/account/${path}`.replace('//', '/')}
                        exact={exact}
                        icon={<FontAwesomeIcon icon={ACCOUNT_ICONS[path] || faUser} fixedWidth />}
                    >
                        {name}
                    </SideLink>
                ))}
            </SideSection>
            {rootAdmin && (
                <SideSection title="Administration">
                    <SideExternal href="/admin" icon={<FontAwesomeIcon icon={faCogs} fixedWidth />}>
                        Admin Panel
                    </SideExternal>
                    <SideExternal href="/admin/aurora-theme" icon={<FontAwesomeIcon icon={faPalette} fixedWidth />}>
                        Theme Settings
                    </SideExternal>
                </SideSection>
            )}
            <SideSection title="Signed in as">
                <p
                    style={{
                        padding: '0.4rem 0.75rem',
                        margin: 0,
                        fontSize: '0.85rem',
                        color: 'var(--aurora-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={username}
                >
                    {username}
                </p>
            </SideSection>
        </>
    );

    return (
        <AuroraShell sidebar={sidebar}>
            {topMode && onAccount && (
                <AuroraPills>
                    {accountLinks.map(({ path, name, exact }) => (
                        <NavLink key={path} to={`/account/${path}`.replace('//', '/')} exact={exact}>
                            {name}
                        </NavLink>
                    ))}
                </AuroraPills>
            )}
            <TransitionRouter>
                <React.Suspense fallback={<Spinner centered />}>
                    <Switch location={location}>
                        <Route path="/" exact>
                            <DashboardContainer />
                        </Route>
                        {routes.account.map(({ path, component: Component }) => (
                            <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                <Component />
                            </Route>
                        ))}
                        <Route path="*">
                            <NotFound />
                        </Route>
                    </Switch>
                </React.Suspense>
            </TransitionRouter>
        </AuroraShell>
    );
};
