/**
 * Aurora Theme — server router.
 *
 * Identical data-flow and route guards as stock (server fetch, install /
 * transfer listeners, websocket handler, conflict-state rendering,
 * permission-gated routes) inside the Aurora shell with a server sidebar.
 */
import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import { CSSTransition } from 'react-transition-group';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faClock,
    faCog,
    faDatabase,
    faExternalLinkAlt,
    faFolderOpen,
    faHistory,
    faHome,
    faNetworkWired,
    faPlay,
    faTerminal,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import { AuroraPills, AuroraShell, SideExternal, SideLink, SideSection } from '@/aurora/layout/AuroraShell';
import { useAuroraConfig } from '@/aurora/ThemeContext';
import { Badge } from '@/aurora/components/feedback';

const SERVER_ICONS: Record<string, typeof faTerminal> = {
    '/': faTerminal,
    '/files': faFolderOpen,
    '/databases': faDatabase,
    '/schedules': faClock,
    '/users': faUsers,
    '/backups': faBoxOpen,
    '/network': faNetworkWired,
    '/startup': faPlay,
    '/settings': faCog,
    '/activity': faHistory,
};

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();
    const config = useAuroraConfig();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const name = ServerContext.useStoreState((state) => state.server.data?.name);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const topMode = config.appearance.sidebarStyle === 'top';

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    const statusTone = !status || status === 'offline' ? 'danger' : status === 'running' ? 'success' : 'warning';
    const statusLabel = !status ? 'Offline' : status.charAt(0).toUpperCase() + status.slice(1);

    const navRoutes = routes.server.filter((route) => !!route.name);

    const renderNavLink = (route: (typeof routes.server)[number], key: string) => {
        const link = (
            <SideLink
                key={key}
                to={to(route.path, true)}
                exact={route.exact}
                icon={<FontAwesomeIcon icon={SERVER_ICONS[route.path] || faTerminal} fixedWidth />}
            >
                {route.name as string}
            </SideLink>
        );
        return route.permission ? (
            <Can key={key} action={route.permission} matchAny>
                {link}
            </Can>
        ) : (
            link
        );
    };

    const sidebar = (
        <>
            <div style={{ padding: '0.5rem 0.75rem 0.75rem', borderBottom: '1px solid var(--aurora-border)', marginBottom: '0.5rem' }}>
                <p
                    style={{
                        margin: 0,
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={name}
                >
                    {name || 'Server'}
                </p>
                <div style={{ marginTop: '0.4rem' }}>
                    <Badge tone={statusTone} dot>
                        {statusLabel}
                    </Badge>
                </div>
            </div>
            <SideSection title="Server">
                {navRoutes.map((route) => renderNavLink(route, route.path))}
            </SideSection>
            <SideSection title="Manage">
                <SideLink to="/" exact icon={<FontAwesomeIcon icon={faHome} fixedWidth />}>
                    All Servers
                </SideLink>
                {rootAdmin && (
                    <SideExternal
                        href={`/admin/servers/view/${serverId}`}
                        icon={<FontAwesomeIcon icon={faExternalLinkAlt} fixedWidth />}
                    >
                        Admin View
                    </SideExternal>
                )}
            </SideSection>
        </>
    );

    return (
        <React.Fragment key="server-router">
            <AuroraShell sidebar={uuid && id ? sidebar : undefined}>
                {!uuid || !id ? (
                    error ? (
                        <ServerError message={error} />
                    ) : (
                        <Spinner size="large" centered />
                    )
                ) : (
                    <>
                        {topMode && (
                            <CSSTransition timeout={150} classNames="fade" appear in>
                                <AuroraPills>
                                    {navRoutes.map((route) =>
                                        route.permission ? (
                                            <Can key={route.path} action={route.permission} matchAny>
                                                <NavLink to={to(route.path, true)} exact={route.exact}>
                                                    {route.name}
                                                </NavLink>
                                            </Can>
                                        ) : (
                                            <NavLink key={route.path} to={to(route.path, true)} exact={route.exact}>
                                                {route.name}
                                            </NavLink>
                                        )
                                    )}
                                    {rootAdmin && (
                                        // eslint-disable-next-line react/jsx-no-target-blank
                                        <a href={`/admin/servers/view/${serverId}`} target="_blank">
                                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                                        </a>
                                    )}
                                </AuroraPills>
                            </CSSTransition>
                        )}
                        <InstallListener />
                        <TransferListener />
                        <WebsocketHandler />
                        {inConflictState && (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                            <ConflictStateRenderer />
                        ) : (
                            <ErrorBoundary>
                                <TransitionRouter>
                                    <Switch location={location}>
                                        {routes.server.map(({ path, permission, component: Component }) => (
                                            <PermissionRoute key={path} permission={permission} path={to(path)} exact>
                                                <Spinner.Suspense>
                                                    <Component />
                                                </Spinner.Suspense>
                                            </PermissionRoute>
                                        ))}
                                        <Route path="*" component={NotFound} />
                                    </Switch>
                                </TransitionRouter>
                            </ErrorBoundary>
                        )}
                    </>
                )}
            </AuroraShell>
        </React.Fragment>
    );
};
