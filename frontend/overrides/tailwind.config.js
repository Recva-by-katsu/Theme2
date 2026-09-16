/**
 * Aurora Theme — tailwind configuration.
 *
 * Based on the stock Pterodactyl 1.14.1 tailwind.config.js. The content paths,
 * fonts, sizes and plugins are unchanged; the COLOR SCALES are remapped to
 * Aurora CSS variables so every stock component (including twin.macro /
 * styled-components with hashed classes) automatically follows the admin's
 * theme configuration at runtime — in both dark and light mode.
 *
 * Ramps use color-mix() (supported by all modern browsers) so a single admin
 * color choice produces a full usable scale.
 */
const colors = require('tailwindcss/colors');

// Tailwind 3 implements `bg-blue-500/75` and `bg-opacity-*` by asking the
// color for a variant with an alpha channel. It cannot parse color-mix()/var()
// strings, so a plain-string scale makes those utilities "not exist" and the
// stock panel build fails (button/style.module.css, inputs/styles.module.css).
// Exposing each step as a function lets Tailwind (and twin.macro) request an
// alpha, which is layered on with a second color-mix(). Called without an
// opacity — theme(), twin's theme(), @tailwindcss/forms — it returns the
// opaque color.
const withAlpha = (value) => ({ opacityValue } = {}) => {
    if (opacityValue === undefined || opacityValue === 1 || opacityValue === '1') return value;
    const numeric = Number(opacityValue);
    const pct = Number.isFinite(numeric) ? `${Math.round(numeric * 10000) / 100}%` : `calc(${opacityValue} * 100%)`;
    return `color-mix(in srgb, ${value} ${pct}, transparent)`;
};

const alphaScale = (scale) => Object.fromEntries(Object.entries(scale).map(([step, value]) => [step, withAlpha(value)]));

const ramp = (name) =>
    alphaScale({
        50: `color-mix(in srgb, var(--aurora-${name}) 8%, white)`,
        100: `color-mix(in srgb, var(--aurora-${name}) 14%, white)`,
        200: `color-mix(in srgb, var(--aurora-${name}) 28%, white)`,
        300: `color-mix(in srgb, var(--aurora-${name}) 48%, white)`,
        400: `color-mix(in srgb, var(--aurora-${name}) 70%, white)`,
        500: `var(--aurora-${name})`,
        600: `color-mix(in srgb, var(--aurora-${name}) 86%, black)`,
        700: `color-mix(in srgb, var(--aurora-${name}) 70%, black)`,
        800: `color-mix(in srgb, var(--aurora-${name}) 52%, black)`,
        900: `color-mix(in srgb, var(--aurora-${name}) 36%, black)`,
        950: `color-mix(in srgb, var(--aurora-${name}) 24%, black)`,
    });

// Neutral/gray scale → Aurora surfaces & text. These tokens are used as BOTH
// container backgrounds (600-900) and text colors (50-500) across the panel,
// so each step resolves to the semantic token that stays readable in both
// dark and light modes.
const gray = alphaScale({
    50: 'var(--aurora-text)',
    100: 'var(--aurora-text)',
    200: 'var(--aurora-text)',
    300: 'var(--aurora-muted)',
    400: 'var(--aurora-muted)',
    500: 'var(--aurora-muted)',
    600: 'var(--aurora-card)',
    700: 'var(--aurora-surface)',
    800: 'var(--aurora-bg)',
    900: 'var(--aurora-bg)',
});

module.exports = {
    content: ['./resources/scripts/**/*.{js,ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                header: ['"IBM Plex Sans"', '"Roboto"', 'system-ui', 'sans-serif'],
            },
            colors: {
                // Terminal + overlay black stays dark in both modes (xterm
                // uses light glyph colors, so a light terminal is unreadable).
                black: '#060a14',
                // Brand + semantic scales follow the admin configuration.
                primary: {
                    ...ramp('primary'),
                    // Text placed directly on primary surfaces stays pure white.
                    50: '#ffffff',
                },
                gray: gray,
                neutral: gray,
                cyan: ramp('accent'),
                blue: ramp('primary'),
                red: ramp('danger'),
                green: ramp('success'),
                yellow: ramp('warning'),
                amber: ramp('warning'),
                // Direct design-token access for Aurora components.
                aurora: alphaScale({
                    primary: 'var(--aurora-primary)',
                    secondary: 'var(--aurora-secondary)',
                    accent: 'var(--aurora-accent)',
                    bg: 'var(--aurora-bg)',
                    surface: 'var(--aurora-surface)',
                    card: 'var(--aurora-card)',
                    text: 'var(--aurora-text)',
                    muted: 'var(--aurora-muted)',
                    border: 'var(--aurora-border)',
                    success: 'var(--aurora-success)',
                    warning: 'var(--aurora-warning)',
                    danger: 'var(--aurora-danger)',
                    info: 'var(--aurora-info)',
                }),
            },
            fontSize: {
                '2xs': '0.625rem',
            },
            transitionDuration: {
                250: '250ms',
            },
            borderColor: (theme) => ({
                default: theme('colors.neutral.400', 'currentColor'),
            }),
            borderRadius: {
                aurora: 'var(--aurora-radius)',
                'aurora-sm': 'var(--aurora-radius-sm)',
                'aurora-lg': 'var(--aurora-radius-lg)',
            },
            boxShadow: {
                aurora: 'var(--aurora-shadow)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/line-clamp'),
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ],
};
