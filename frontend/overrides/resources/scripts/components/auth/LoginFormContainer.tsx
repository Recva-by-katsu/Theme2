/**
 * Aurora Theme — authentication form shell.
 *
 * Same component contract as stock (forwardRef form, `title` prop, children
 * rendered inside the Formik <Form>) with a fully redesigned presentation:
 * glass/solid/outline card, optional split artwork panel, brand logo, live
 * theme backgrounds — all driven by Admin → Theme Settings → Login.
 */
import React, { forwardRef } from 'react';
import { Form } from 'formik';
import FlashMessageRender from '@/components/FlashMessageRender';
import { useAuroraConfig } from '@/aurora/ThemeContext';
import { AuroraMark } from '@/aurora/components/brand';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

export default forwardRef<HTMLFormElement, Props>(({ title, children, ...props }, ref) => {
    const config = useAuroraConfig();
    const panelName = useStoreState((state: ApplicationStore) => state.settings.data?.name || 'Pterodactyl');

    const brandName = config.brand.name || panelName;
    const heading = config.login.title || title || 'Welcome back';
    const subtitle = config.login.subtitle || `Sign in to continue to ${brandName}`;
    const split = config.login.sideArt;

    const card = (
        <div className="aurora-auth-card">
            {config.login.showLogo && (
                <div className="aurora-auth-logo">
                    {config.brand.logoUrl ? (
                        <img
                            src={config.brand.logoUrl}
                            alt={`${brandName} logo`}
                            style={{ height: 52, objectFit: 'contain' }}
                        />
                    ) : (
                        <AuroraMark size={52} />
                    )}
                </div>
            )}
            <h1 className="aurora-auth-title">{heading}</h1>
            <p className="aurora-auth-subtitle">{subtitle}</p>
            <div style={{ marginBottom: '1rem' }}>
                <FlashMessageRender />
            </div>
            <Form {...props} ref={ref}>
                {children}
            </Form>
            <p className="aurora-auth-footer">
                {config.brand.footerText ||
                    `© 2015 - ${new Date().getFullYear()} ${brandName} · Powered by Pterodactyl®`}
            </p>
        </div>
    );

    if (!split) return card;

    return (
        <div className="aurora-auth-split">
            <div className="aurora-auth-art" aria-hidden="true">
                <AuroraMark size={56} />
                <h2>{brandName}</h2>
                <p>{config.brand.description || 'Game & application server management, beautifully simple.'}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {['Consoles', 'Files', 'Backups'].map((chip) => (
                        <span
                            key={chip}
                            style={{
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '9999px',
                                background: 'var(--aurora-primary-soft)',
                                border: '1px solid var(--aurora-border)',
                                color: 'var(--aurora-text)',
                            }}
                        >
                            {chip}
                        </span>
                    ))}
                </div>
            </div>
            {card}
        </div>
    );
});
