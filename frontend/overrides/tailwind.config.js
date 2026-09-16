/**
 * Aurora Theme — tailwind configuration.
 *
 * Based on the stock Pterodactyl 1.14.x / 1.15.x tailwind.config.js. The content
 * paths, fonts, sizes and plugins are unchanged; the COLOR SCALES are remapped
 * to Aurora CSS variables so every stock component (including twin.macro /
 * styled-components with hashed classes) automatically follows the admin's
 * theme configuration at runtime — in both dark and light mode.
 *
 * Ramps use color-mix() (supported by all modern browsers) so a single admin
 * color choice produces a full usable scale.
 *
 * ---------------------------------------------------------------------------
 * WHY EVERY TOKEN IS WRAPPED IN `alphaColor()`
 *
 * The panel consumes these scales with ALPHA MODIFIERS. Stock stylesheets do:
 *
 *     // resources/scripts/components/elements/button/style.module.css
 *     &:disabled { @apply bg-blue-500/75 text-blue-200/75; }
 *
 *     // resources/scripts/components/elements/inputs/styles.module.css
 *     &.indeterminate:checked { @apply text-primary-500/50 border border-primary-500; }
 *
 * To emit `bg-blue-500/75`, Tailwind parses the configured color and re-emits it
 * with the requested opacity. It cannot parse `var(...)` or `color-mix(...)`
 * values — those candidates are dropped, and `@apply` then aborts the webpack
 * build with:
 *
 *     The `bg-blue-500/75` class does not exist.
 *
 * Function values are Tailwind's documented escape hatch for CSS-variable
 * palettes: the helper is invoked bare (plain utilities, `theme()`) and with
 * `{ opacityValue }` (alpha modifiers). Returning the raw token in the first
 * case keeps the design unchanged; in the second case the token is mixed with
 * `transparent`, which color-mix() premultiplies, so the result is exactly the
 * token at N% alpha.
 * ---------------------------------------------------------------------------
 */

/**
 * Convert a Tailwind opacity modifier into a `color-mix()` percentage.
 * Handles numbers (`/75` -> 0.75) and literal percentages (`/75%`), plus the
 * runtime variable Tailwind injects for the classic `bg-opacity-*` utilities
 * (`var(--tw-bg-opacity, 1)`), which CSS resolves at computed-value time.
 */
const alphaPercentage = (opacityValue) => {
    if (typeof opacityValue === 'string' && opacityValue.trim().endsWith('%')) {
        return opacityValue.trim();
    }
    return `calc(${opacityValue} * 100%)`;
};

/**
 * Make one color token alpha-aware.
 *
 * - `bg-primary-500`      -> the token, untouched.
 * - `bg-primary-500/75`   -> `color-mix(in srgb, <token> 75%, transparent)`.
 * - `bg-primary-500/75%`, `text-primary-500/[0.35]` -> same, verbatim alpha.
 */
const alphaColor = (token) => (options) => {
    const opacityValue = options && options.opacityValue;
    if (opacityValue === undefined || opacityValue === null || opacityValue === '') {
        return token;
    }
    return `color-mix(in srgb, ${token} ${alphaPercentage(opacityValue)}, transparent)`;
};

/**
 * A full 50-950 scale derived from a single `--aurora-<name>` admin color.
 * Steps are OPAQUE approximations mixed from the brand token; the alpha-aware
 * wrapper keeps `/opacity` modifiers working on every step.
 */
const ramp = (name) => ({
    50: alphaColor(`color-mix(in srgb, var(--aurora-${name}) 8%, white)`),
    100: alphaColor(`color-mix(in srgb, var(--aurora-${name}) 14%, white)`),
    200: alphaColor(`color-mix(in srgb, var(--aurora-${name}) 28%, white)`),
    300: alphaColor(`color-mix(in srgb, var(--aurora-${name}) 48%, white)`),
    400: alphaColor(`color-mix(in srgb, var(--aurora-${name}) 70%, white)`),
    500: alphaColor(`var(--aurora-${name})`),
    600: alphaColor(`color-mix(in srgb, var(--aurora-${name}) 86%, black)`),
    700: alphaColor(`color-mix(in srgb, var(--aurora-${name}) 70%, black)`),
    800: alphaColor(`color-mix(in srgb, var(--aurora-${name}) 52%, black)`),
    900: alphaColor(`color-mix(in srgb, var(--aurora-${name}) 36%, black)`),
    950: alphaColor(`color-mix(in srgb, var(--aurora-${name}) 24%, black)`),
});

// Neutral/gray scale → Aurora surfaces & text. These tokens are used as BOTH
// container backgrounds (600-900) and text colors (50-500) across the panel,
// so each step resolves to the semantic token that stays readable in both
// dark and light modes.
const gray = {
    50: alphaColor('var(--aurora-text)'),
    100: alphaColor('var(--aurora-text)'),
    200: alphaColor('var(--aurora-text)'),
    300: alphaColor('var(--aurora-muted)'),
    400: alphaColor('var(--aurora-muted)'),
    500: alphaColor('var(--aurora-muted)'),
    600: alphaColor('var(--aurora-card)'),
    700: alphaColor('var(--aurora-surface)'),
    800: alphaColor('var(--aurora-bg)'),
    900: alphaColor('var(--aurora-bg)'),
};

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
                // Literal hex: Tailwind can apply alpha to it natively.
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
                aurora: {
                    primary: alphaColor('var(--aurora-primary)'),
                    secondary: alphaColor('var(--aurora-secondary)'),
                    accent: alphaColor('var(--aurora-accent)'),
                    bg: alphaColor('var(--aurora-bg)'),
                    surface: alphaColor('var(--aurora-surface)'),
                    card: alphaColor('var(--aurora-card)'),
                    text: alphaColor('var(--aurora-text)'),
                    muted: alphaColor('var(--aurora-muted)'),
                    border: alphaColor('var(--aurora-border)'),
                    success: alphaColor('var(--aurora-success)'),
                    warning: alphaColor('var(--aurora-warning)'),
                    danger: alphaColor('var(--aurora-danger)'),
                    info: alphaColor('var(--aurora-info)'),
                },
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
