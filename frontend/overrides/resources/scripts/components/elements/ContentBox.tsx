/**
 * Aurora Theme — account-page content box (same API as stock).
 */
import React from 'react';
import FlashMessageRender from '@/components/FlashMessageRender';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import styled from 'styled-components/macro';

type Props = Readonly<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
        title?: string;
        borderColor?: string;
        showFlashes?: string | boolean;
        showLoadingOverlay?: boolean;
    }
>;

const Title = styled.h2`
    color: var(--aurora-text);
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0 0 1rem;
    padding: 0 0.25rem;
`;

const Card = styled.div<{ $borderColor?: string }>`
    position: relative;
    background: var(--aurora-card);
    border: 1px solid var(--aurora-border);
    ${(props) => props.$borderColor && `border-top: 3px solid ${props.$borderColor};`}
    border-radius: var(--aurora-radius);
    box-shadow: var(--aurora-shadow);
    padding: 1.25rem;
`;

const ContentBox = ({ title, borderColor, showFlashes, showLoadingOverlay, children, ...props }: Props) => (
    <div {...props}>
        {title && <Title>{title}</Title>}
        {showFlashes && (
            <div style={{ marginBottom: '1rem' }}>
                <FlashMessageRender byKey={typeof showFlashes === 'string' ? showFlashes : undefined} />
            </div>
        )}
        <Card $borderColor={borderColor}>
            <SpinnerOverlay visible={showLoadingOverlay || false} />
            {children}
        </Card>
    </div>
);

export default ContentBox;
