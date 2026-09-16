/**
 * Aurora Theme — server card.
 *
 * Data behavior is identical to stock (live resource polling every 30s,
 * alarm thresholds, suspended / maintenance / transfer states); the
 * presentation is a modern card with status badge, address bar and
 * resource tiles. Supports both grid and list layouts.
 */
import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import classNames from 'classnames';
import { Badge } from '@/aurora/components/feedback';
import { LoadingVisual } from '@/aurora/components/feedback';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

type Timer = ReturnType<typeof setInterval>;

function statusBadge(status: ServerPowerState | undefined, server: Server): React.ReactNode {
    if (server.status === 'suspended') return <Badge tone="danger">Suspended</Badge>;
    if (server.isNodeUnderMaintenance) return <Badge tone="warning">Maintenance</Badge>;
    if (server.isTransferring) return <Badge tone="info">Transferring</Badge>;
    if (server.status === 'installing') return <Badge tone="info">Installing</Badge>;
    if (server.status === 'restoring_backup') return <Badge tone="info">Restoring</Badge>;
    if (!status || status === 'offline') return <Badge tone="danger" dot={false}>Offline</Badge>;
    if (status === 'running') return <Badge tone="success" dot>Running</Badge>;
    return <Badge tone="warning" dot>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

const Stat = memo(({ label, value, alarm }: { label: string; value: string; alarm?: boolean }) => (
    <div className={classNames('aurora-server-stat', alarm && 'alarm')}>
        <div className="v">{value}</div>
        <div className="l">{label}</div>
    </div>
));
Stat.displayName = 'ServerCardStat';

export default ({ server, className, layout = 'grid' }: { server: Server; className?: string; layout?: 'grid' | 'list' }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended || server.isNodeUnderMaintenance) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended, server.isNodeUnderMaintenance]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : '∞';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : '∞';
    const cpuLimit = server.limits.cpu !== 0 ? `${server.limits.cpu}%` : '∞';

    const address = server.allocations
        .filter((alloc) => alloc.isDefault)
        .map((allocation) => `${allocation.alias || ip(allocation.ip)}:${allocation.port}`)
        .join(', ');

    const showStats = stats && !isSuspended && !server.isNodeUnderMaintenance && !server.isTransferring && !server.status;

    return (
        <Link
            to={`/server/${server.id}`}
            className={classNames('aurora-card', 'aurora-server-card', className)}
            style={{ textDecoration: 'none' }}
            aria-label={`Manage server ${server.name}`}
        >
            <div className="aurora-server-card-top">
                <span className="aurora-server-icon" aria-hidden="true">
                    <FontAwesomeIcon icon={faServer} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="aurora-server-name" title={server.name}>
                        {server.name}
                    </p>
                    {!!server.description && <p className="aurora-server-desc">{server.description}</p>}
                </div>
                <span style={{ flexShrink: 0 }}>{statusBadge(stats?.status, server)}</span>
            </div>
            <div className="aurora-server-addr">
                <FontAwesomeIcon icon={faEthernet} aria-hidden="true" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{address || '—'}</span>
            </div>
            {layout === 'list' ? (
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem 1rem', flexWrap: 'wrap' }}>
                    {showStats ? (
                        <>
                            <span style={{ fontSize: '0.82rem', color: alarms.cpu ? 'var(--aurora-danger)' : 'var(--aurora-muted)' }}>
                                CPU {stats!.cpuUsagePercent.toFixed(1)}% / {cpuLimit}
                            </span>
                            <span style={{ color: 'var(--aurora-border)' }}>|</span>
                            <span style={{ fontSize: '0.82rem', color: alarms.memory ? 'var(--aurora-danger)' : 'var(--aurora-muted)' }}>
                                RAM {bytesToString(stats!.memoryUsageInBytes)} / {memoryLimit}
                            </span>
                            <span style={{ color: 'var(--aurora-border)' }}>|</span>
                            <span style={{ fontSize: '0.82rem', color: alarms.disk ? 'var(--aurora-danger)' : 'var(--aurora-muted)' }}>
                                Disk {bytesToString(stats!.diskUsageInBytes)} / {diskLimit}
                            </span>
                        </>
                    ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--aurora-muted)' }}>
                            {isSuspended || server.status === 'suspended'
                                ? 'This server is suspended.'
                                : server.isNodeUnderMaintenance
                                ? 'Node is under maintenance.'
                                : 'Loading live stats…'}
                        </span>
                    )}
                </div>
            ) : (
                <div className="aurora-server-stats">
                    {showStats ? (
                        <>
                            <Stat label={`CPU / ${cpuLimit}`} value={`${stats!.cpuUsagePercent.toFixed(1)}%`} alarm={alarms.cpu} />
                            <Stat label={`RAM / ${memoryLimit}`} value={bytesToString(stats!.memoryUsageInBytes)} alarm={alarms.memory} />
                            <Stat label={`Disk / ${diskLimit}`} value={bytesToString(stats!.diskUsageInBytes)} alarm={alarms.disk} />
                        </>
                    ) : (
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '0.4rem 0' }}>
                            {!stats && !isSuspended && !server.isNodeUnderMaintenance && !server.status ? (
                                <LoadingVisual label={`Loading stats for ${server.name}`} />
                            ) : (
                                <span style={{ fontSize: '0.82rem', color: 'var(--aurora-muted)' }}>
                                    {isSuspended || server.status === 'suspended'
                                        ? 'Suspended — stats unavailable.'
                                        : server.isNodeUnderMaintenance
                                        ? 'Node under maintenance.'
                                        : server.isTransferring
                                        ? 'Server is being transferred.'
                                        : server.status === 'installing'
                                        ? 'Server is installing.'
                                        : 'Stats unavailable.'}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Link>
    );
};
