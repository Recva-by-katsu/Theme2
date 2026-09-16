/**
 * Aurora Theme — global stylesheet (replaces the stock GlobalStylesheet).
 *
 * All values resolve to Aurora design tokens so the admin configuration
 * (colors, fonts, radius, motion) applies everywhere, in dark and light mode.
 */
import tw from 'twin.macro';
import { createGlobalStyle } from 'styled-components/macro';
// @ts-expect-error untyped font file
import font from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2';

export default createGlobalStyle`
    @font-face {
        font-family: 'IBM Plex Sans';
        font-style: normal;
        font-display: swap;
        font-weight: 100 700;
        src: url(${font}) format('woff2-variations');
        unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
    }

    html {
        font-size: var(--aurora-font-size);
    }

    body {
        font-family: var(--aurora-font);
        font-weight: var(--aurora-font-weight);
        line-height: var(--aurora-line-height);
        background-color: var(--aurora-bg);
        color: var(--aurora-text);
        letter-spacing: 0.015em;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
    }

    h1, h2, h3, h4, h5, h6 {
        font-family: var(--aurora-font);
        font-weight: 600;
        letter-spacing: -0.01em;
        color: var(--aurora-text);
    }

    p {
        color: var(--aurora-text);
        line-height: var(--aurora-line-height);
    }

    a {
        color: var(--aurora-accent);
    }

    form {
        ${tw`m-0`};
    }

    textarea, select, input, button, button:focus, button:focus-visible {
        ${tw`outline-none`};
    }

    :focus-visible {
        outline: 2px solid var(--aurora-accent);
        outline-offset: 2px;
    }

    ::selection {
        background: var(--aurora-primary);
        color: #fff;
    }

    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield !important;
    }

    /* Scrollbars follow the theme. */
    ::-webkit-scrollbar {
        background: none;
        width: 10px;
        height: 10px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: var(--aurora-border);
        border-radius: 8px;
        border: 2px solid transparent;
        background-clip: content-box;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: var(--aurora-muted);
        background-clip: content-box;
    }

    * {
        scrollbar-width: thin;
        scrollbar-color: var(--aurora-border) transparent;
    }

    /* Page transition states (used with TransitionRouter / CSSTransition). */
    html[data-aurora-animations='1'] {
        .fade-appear, .fade-enter {
            opacity: 0;
            transform: translateY(6px);
        }
        .fade-appear-active, .fade-enter-active {
            opacity: 1;
            transform: translateY(0);
            transition: opacity var(--aurora-ms-base) ease-out, transform var(--aurora-ms-base) ease-out;
        }
        .fade-exit { opacity: 1; }
        .fade-exit-active {
            opacity: 0;
            transition: opacity var(--aurora-ms-fast) ease-in;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
`;
