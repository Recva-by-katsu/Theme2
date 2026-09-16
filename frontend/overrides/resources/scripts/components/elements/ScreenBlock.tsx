/**
 * Aurora Theme — error / not-found screens.
 *
 * Same exports & prop contracts as stock (default ScreenBlock, ServerError,
 * NotFound) with a redesigned presentation: themed card, status code display,
 * retry/back actions, and support links.
 */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faExclamationTriangle,
    faHome,
    faSearch,
    faSyncAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { AuroraCard } from '@/aurora/components/Card';
import { AuroraButton } from '@/aurora/components/Button';

interface BaseProps {
    title: string;
    message: string;
    code?: string | number;
    onRetry?: () => void;
    onBack?: () => void;
    // Accepted for API compatibility with stock (custom artwork is ignored
    // in favor of the themed illustration).
    image?: string;
}

interface PropsWithRetry extends BaseProps {
    onRetry?: () => void;
    onBack?: never;
}

interface PropsWithBack extends BaseProps {
    onBack?: () => void;
    onRetry?: never;
}

export type ScreenBlockProps = PropsWithBack | PropsWithRetry;

const ScreenBlock = ({ title, message, code, onBack, onRetry }: ScreenBlockProps) => {
    const history = useHistory();
    const goDashboard = () => history.push('/');

    return (
        <PageContentBlock>
            <div className="flex justify-center px-2">
                <AuroraCard $pad={false} style={{ width: '100%', maxWidth: '36rem', textAlign: 'center', padding: '3rem 2rem' }}>
                    <div className="aurora-empty-icon" style={{ fontSize: '2.6rem' }}>
                        <FontAwesomeIcon icon={onRetry ? faExclamationTriangle : faSearch} />
                    </div>
                    {code !== undefined && (
                        <p
                            style={{
                                fontSize: '3.2rem',
                                fontWeight: 800,
                                margin: '0.5rem 0 0',
                                letterSpacing: '-0.03em',
                                background: 'linear-gradient(120deg, var(--aurora-primary), var(--aurora-accent))',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                color: 'transparent',
                            }}
                        >
                            {code}
                        </p>
                    )}
                    <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem' }}>{title}</h2>
                    <p style={{ color: 'var(--aurora-muted)', margin: '0.5rem auto 0', maxWidth: '24rem' }}>{message}</p>
                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                        {(typeof onBack === 'function' || typeof onRetry === 'function') && (
                            <AuroraButton
                                variant="primary"
                                onClick={() => (onRetry ? onRetry() : onBack ? onBack() : undefined)}
                            >
                                <FontAwesomeIcon icon={onRetry ? faSyncAlt : faArrowLeft} />
                                {onRetry ? 'Try Again' : 'Go Back'}
                            </AuroraButton>
                        )}
                        <AuroraButton variant="secondary" onClick={goDashboard}>
                            <FontAwesomeIcon icon={faHome} />
                            Dashboard
                        </AuroraButton>
                    </div>
                </AuroraCard>
            </div>
        </PageContentBlock>
    );
};

type ServerErrorProps = (Omit<PropsWithBack, 'title'> | Omit<PropsWithRetry, 'title'>) & {
    title?: string;
};

const ServerError = ({ title, ...props }: ServerErrorProps) => (
    <ScreenBlock title={title || 'Something went wrong'} message="An unexpected error occurred. Please try again — if the problem persists, contact your server administrator." code="500" {...(props as ScreenBlockProps)} />
);

const NotFound = ({ title, message, onBack }: Partial<Pick<ScreenBlockProps, 'title' | 'message' | 'onBack'>>) => (
    <ScreenBlock
        title={title || 'Page not found'}
        code="404"
        message={message || 'The requested resource was not found.'}
        onBack={onBack}
    />
);

export { ServerError, NotFound };
export default ScreenBlock;
