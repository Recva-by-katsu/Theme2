/**
 * Aurora Theme — dashboard.
 *
 * Same data layer as stock (paginated server list via SWR, admin "all
 * servers" toggle persisted per user) with a redesigned experience:
 * server-side search, sorting, grid/list layouts, skeleton loading,
 * empty states and a responsive card grid.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faThLarge, faList } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, SearchBox } from '@/aurora/components/navigation';
import { Alert, EmptyState, SkeletonCard } from '@/aurora/components/feedback';
import { AuroraSelect, Segmented, Toggle } from '@/aurora/components/forms';
import { useAuroraConfig } from '@/aurora/ThemeContext';

type SortKey = 'name' | 'status';

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');
    const config = useAuroraConfig();

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sort, setSort] = useState<SortKey>('name');
    const [layout, setLayout] = usePersistedState<'grid' | 'list'>('aurora:server-layout', config.appearance.cardLayout);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    // Debounce search input → server-side filtering.
    useEffect(() => {
        const t = window.setTimeout(() => {
            setDebouncedQuery(query.trim());
            setPage(1);
        }, 400);
        return () => window.clearTimeout(t);
    }, [query]);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page, debouncedQuery],
        () =>
            getServers({
                page,
                type: showOnlyAdmin && rootAdmin ? 'admin' : undefined,
                query: debouncedQuery || undefined,
            })
    );

    useEffect(() => {
        setPage(1);
    }, [showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    const sorted = useMemo(() => {
        if (!servers) return [];
        const items = [...servers.items];
        if (sort === 'name') {
            items.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            const rank = (s: Server) =>
                s.status === 'suspended' ? 3 : s.isNodeUnderMaintenance ? 2 : s.status ? 1 : 0;
            items.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
        }
        return items;
    }, [servers, sort]);

    return (
        <PageContentBlock title="Dashboard" showFlashKey="dashboard">
            <PageHeader
                title="Your Servers"
                subtitle={
                    servers
                        ? `${servers.pagination.total} server${servers.pagination.total === 1 ? '' : 's'}`
                        : 'Loading…'
                }
                actions={
                    rootAdmin ? (
                        <Toggle
                            checked={showOnlyAdmin}
                            onChange={() => setShowOnlyAdmin((s) => !s)}
                            label={showOnlyAdmin ? "Showing others' servers" : 'Showing your servers'}
                        />
                    ) : undefined
                }
            />

            <div className="aurora-dash-toolbar">
                <SearchBox
                    value={query}
                    onChange={setQuery}
                    placeholder="Search servers…"
                    ariaLabel="Search servers"
                />
                <AuroraSelect
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label="Sort servers"
                    style={{ width: 'auto' }}
                >
                    <option value="name">Sort: Name</option>
                    <option value="status">Sort: Status</option>
                </AuroraSelect>
                <Segmented
                    ariaLabel="Card layout"
                    value={layout}
                    onChange={setLayout}
                    options={[
                        { value: 'grid', label: <FontAwesomeIcon icon={faThLarge} />, title: 'Grid view' },
                        { value: 'list', label: <FontAwesomeIcon icon={faList} />, title: 'List view' },
                    ]}
                />
            </div>

            {error ? (
                <Alert type="error" title="Could not load servers">
                    {(error as Error)?.message || 'An unexpected error occurred while loading your servers.'}
                </Alert>
            ) : !servers ? (
                <div className="aurora-server-grid" aria-label="Loading servers">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} lines={2} />
                    ))}
                </div>
            ) : (
                <Pagination data={{ ...servers, items: sorted }} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            <div className={layout === 'grid' ? 'aurora-server-grid' : 'aurora-server-list'}>
                                {items.map((server) => (
                                    <ServerRow key={server.uuid} server={server} layout={layout} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<FontAwesomeIcon icon={faServer} />}
                                title={debouncedQuery ? 'No servers match your search' : showOnlyAdmin ? 'No other servers to display' : 'No servers yet'}
                                description={
                                    debouncedQuery
                                        ? `Nothing matches "${debouncedQuery}". Try a different search term.`
                                        : showOnlyAdmin
                                        ? 'There are no other servers to display.'
                                        : 'There are no servers associated with your account.'
                                }
                                action={
                                    debouncedQuery ? (
                                        <button
                                            type="button"
                                            className="aurora-auth-alt"
                                            style={{ marginTop: 0 }}
                                            onClick={() => setQuery('')}
                                        >
                                            Clear search
                                        </button>
                                    ) : undefined
                                }
                            />
                        )
                    }
                </Pagination>
            )}
        </PageContentBlock>
    );
};
