/**
 * Aurora Theme — server console / overview.
 *
 * Same composition as stock (power controls, live console, stat tiles,
 * resource graphs, egg features, maintenance/install/transfer warnings)
 * with a redesigned layout: server header with live status, terminal
 * window chrome with connection indicator, and responsive stat grid.
 */
import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import { Alert } from '@/aurora/components/feedback';
import { Badge, StatusDot } from '@/aurora/components/feedback';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const description = ServerContext.useStoreState((state) => state.server.data!.description);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);

    const statusTone = !status || status === 'offline' ? 'danger' : status === 'running' ? 'success' : 'warning';
    const statusLabel = !status ? 'Offline' : status.charAt(0).toUpperCase() + status.slice(1);

    return (
        <ServerContentBlock title="Console">
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <div style={{ marginBottom: '1rem' }}>
                    <Alert type="warning">
                        {isNodeUnderMaintenance
                            ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                            : isInstalling
                            ? 'This server is currently running its installation process and most actions are unavailable.'
                            : 'This server is currently being transferred to another node and all actions are unavailable.'}
                    </Alert>
                </div>
            )}
            <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="hidden sm:block sm:col-span-2 lg:col-span-3 sm:pr-4 min-w-0">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                        <h1
                            className="aurora-h1"
                            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                            {name}
                        </h1>
                        <Badge tone={statusTone} dot>
                            {statusLabel}
                        </Badge>
                    </div>
                    {!!description && (
                        <p className="aurora-page-subtitle" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {description}
                        </p>
                    )}
                </div>
                <div className="col-span-4 sm:col-span-2 lg:col-span-1 self-end">
                    <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                        <PowerButtons />
                    </Can>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4">
                <div className="col-span-4 xl:col-span-3 min-w-0">
                    <div className="aurora-term">
                        <div className="aurora-term-bar">
                            <span className="aurora-term-dots" aria-hidden="true">
                                <span />
                                <span />
                                <span />
                            </span>
                            <span className="aurora-term-title">console — {name}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--aurora-muted)' }}>
                                <StatusDot tone={connected ? 'success' : 'danger'} pulse={connected} />
                                {connected ? 'Live' : 'Connecting…'}
                            </span>
                        </div>
                        <div className="aurora-term-body">
                            <Spinner.Suspense>
                                <Console />
                            </Spinner.Suspense>
                        </div>
                    </div>
                </div>
                <ServerDetailsBlock className="col-span-4 xl:col-span-1 order-last xl:order-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>
            <Features enabled={eggFeatures} />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
