/**
 * Aurora Theme — responsive data table.
 */
import React from 'react';
import styled from 'styled-components/macro';
import classNames from 'classnames';
import { EmptyState } from './feedback';
import { LoadingVisual } from './feedback';

const TableWrap = styled.div`
    overflow-x: auto;
    background: var(--aurora-card);
    border: 1px solid var(--aurora-border);
    border-radius: var(--aurora-radius);
    box-shadow: var(--aurora-shadow);
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;

    thead th {
        text-align: left;
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--aurora-muted);
        padding: 0.7rem 1rem;
        border-bottom: 1px solid var(--aurora-border);
        background: var(--aurora-elev-1);
        white-space: nowrap;
    }

    tbody td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--aurora-border);
        color: var(--aurora-text);
        vertical-align: middle;
    }

    tbody tr:last-child td {
        border-bottom: none;
    }

    tbody tr {
        transition: background var(--aurora-ms-fast);
    }

    tbody tr:hover {
        background: var(--aurora-primary-soft);
    }
    html[data-aurora-animations='0'] tbody tr {
        transition: none;
    }
`;

export interface DataColumn<T> {
    key: string;
    header: React.ReactNode;
    render: (row: T) => React.ReactNode;
    className?: string;
}

export function DataTable<T>({
    columns,
    rows,
    rowKey,
    loading,
    emptyTitle = 'Nothing here yet',
    emptyDescription,
    emptyAction,
    className,
    ariaLabel,
}: {
    columns: DataColumn<T>[];
    rows: T[];
    rowKey: (row: T, index: number) => string | number;
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: React.ReactNode;
    emptyAction?: React.ReactNode;
    className?: string;
    ariaLabel?: string;
}) {
    if (loading) {
        return (
            <TableWrap className={classNames('aurora-table-loading', className)}>
                <div className="aurora-table-state">
                    <LoadingVisual label="Loading table" />
                </div>
            </TableWrap>
        );
    }

    if (rows.length === 0) {
        return (
            <div className={className}>
                <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
            </div>
        );
    }

    return (
        <TableWrap className={classNames('aurora-data-table', className)}>
            <Table aria-label={ariaLabel}>
                <thead>
                    <tr>
                        {columns.map((c) => (
                            <th key={c.key} scope="col" className={c.className}>
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={rowKey(row, i)}>
                            {columns.map((c) => (
                                <td key={c.key} className={c.className}>
                                    {c.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Table>
        </TableWrap>
    );
}
