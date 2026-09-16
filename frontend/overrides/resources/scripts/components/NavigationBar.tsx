/**
 * Aurora Theme — NavigationBar compatibility shim.
 *
 * The Aurora routers render the full shell (top bar + sidebar) directly.
 * This module keeps the stock import path working for any other consumer
 * by rendering the Aurora top bar on its own.
 */
import React from 'react';
import { AuroraTopBar } from '@/aurora/layout/AuroraShell';

export default () => (
    <>
        <AuroraTopBar />
        <div style={{ height: '0.5rem' }} />
    </>
);
