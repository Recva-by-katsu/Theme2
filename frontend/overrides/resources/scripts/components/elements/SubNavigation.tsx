/**
 * Aurora Theme — SubNavigation (same API, Aurora pill styling).
 */
import React from 'react';

type Props = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const SubNavigation: React.FC<Props> = ({ children, ...props }) => (
    <nav {...props} className={`aurora-subnav ${props.className ?? ''}`} aria-label="Section navigation">
        {children}
    </nav>
);

export default SubNavigation;
