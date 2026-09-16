/**
 * Aurora Theme — titled container (same API as stock).
 *
 * Frames the settings, startup-variable and permission boxes on server
 * pages with the Aurora card system.
 */
import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import styled from 'styled-components/macro';
import isEqual from 'react-fast-compare';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const Box = styled.div`
    background: var(--aurora-card);
    border: 1px solid var(--aurora-border);
    border-radius: var(--aurora-radius);
    box-shadow: var(--aurora-shadow);
    overflow: hidden;
`;

const Head = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.8rem 1rem;
    background: var(--aurora-elev-1);
    border-bottom: 1px solid var(--aurora-border);
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--aurora-text);

    & svg {
        color: var(--aurora-primary);
    }
`;

const Body = styled.div`
    padding: 1rem;
`;

const TitledGreyBox = ({ icon, title, children, className }: Props) => (
    <Box className={className}>
        <Head>
            {typeof title === 'string' ? (
                <>
                    {icon && <FontAwesomeIcon icon={icon} />}
                    <span>{title}</span>
                </>
            ) : (
                title
            )}
        </Head>
        <Body>{children}</Body>
    </Box>
);

export default memo(TitledGreyBox, isEqual);
