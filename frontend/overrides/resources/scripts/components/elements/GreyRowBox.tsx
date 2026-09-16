/**
 * Aurora Theme — row container (same API as stock).
 *
 * Used by database, backup, allocation, schedule, user and API-key rows
 * across the panel; restyled to the Aurora card system with live tokens.
 */
import styled from 'styled-components/macro';

export default styled.div<{ $hoverable?: boolean }>`
    display: flex;
    align-items: center;
    background: var(--aurora-card);
    border: 1px solid var(--aurora-border);
    border-radius: var(--aurora-radius);
    box-shadow: var(--aurora-shadow);
    color: var(--aurora-text);
    padding: 1rem;
    overflow: hidden;
    text-decoration: none;

    html[data-aurora-animations='1'] & {
        transition: border-color var(--aurora-ms-fast), transform var(--aurora-ms-fast),
            box-shadow var(--aurora-ms-fast);
    }

    ${(props) =>
        props.$hoverable !== false &&
        `
        &:hover {
            border-color: var(--aurora-primary);
        }
        html[data-aurora-animations='1'] &:hover {
            transform: translateY(-1px);
        }
    `}

    & .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3.25rem;
        height: 3.25rem;
        flex-shrink: 0;
        border-radius: var(--aurora-radius-sm);
        background: var(--aurora-primary-soft);
        color: var(--aurora-primary);
        font-size: 1.1rem;
    }
`;
