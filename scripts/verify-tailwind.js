#!/usr/bin/env node
/**
 * Aurora Theme — Tailwind color-pipeline self-test.
 *
 * Guards the failure mode that broke the frontend build on stock panels:
 *
 *   (45:9) resources/scripts/components/elements/button/style.module.css
 *   The `bg-blue-500/75` class does not exist. If `bg-blue-500/75` is a
 *   custom class, make sure it is defined within a `@layer` directive.
 *
 * Stock Pterodactyl stylesheets apply alpha modifiers to the remapped palette
 * (`elements/button/style.module.css`, `elements/inputs/styles.module.css`).
 * Tailwind resolves those by *parsing* the configured color, so a palette made
 * of raw `var(...)` / `color-mix(...)` strings silently loses every
 * alpha-modified candidate and aborts `@apply`. Aurora tokens must therefore
 * stay alpha-aware (functions — see `alphaColor()` in tailwind.config.js).
 *
 * What it checks:
 *   1. Every leaf in `theme.extend.colors` is either a Tailwind function color
 *      or a plain literal color — never an alpha-hostile CSS expression.
 *   2. The panel's own Tailwind/PostCSS build compiles the alpha patterns used
 *      by the stock stylesheets.
 *   3. The real stock stylesheets compile (when present).
 *
 * Usage (from anywhere, panel deps installed):
 *   node scripts/verify-tailwind.js --panel-dir /var/www/pterodactyl
 *
 * Exit codes: 0 = healthy (or nothing to test), 1 = regression detected.
 * It never modifies the panel; safe to run at any time.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';

const ok = (msg) => console.log(`${GREEN}[OK]${RESET} ${msg}`);
const warn = (msg) => console.log(`${YELLOW}[WARN]${RESET} ${msg}`);
const fail = (msg) => console.log(`${RED}[FAIL]${RESET} ${msg}`);

let failures = 0;
const MAX_DETAILED_FAILURES = 5;
const reportFail = (msg, hint) => {
    failures += 1;
    if (failures > MAX_DETAILED_FAILURES) return;
    fail(msg);
    if (hint) console.log(`${DIM}       ${hint}${RESET}`);
    if (failures === MAX_DETAILED_FAILURES) console.log(`${DIM}       … further problems are summarised below.${RESET}`);
};

// ---------------------------------------------------------------------------
// Locate the panel + its frontend toolchain.
// ---------------------------------------------------------------------------
function parseArgs(argv) {
    const opts = { panelDir: process.env.PANEL_DIR_RESOLVED || process.env.PANEL_DIR || '' };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--panel-dir') opts.panelDir = argv[i + 1] || '';
        else if (arg.startsWith('--panel-dir=')) opts.panelDir = arg.slice('--panel-dir='.length);
        else if (arg === '--help' || arg === '-h') opts.help = true;
    }
    return opts;
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
    console.log('Usage: node scripts/verify-tailwind.js [--panel-dir /var/www/pterodactyl]');
    process.exit(0);
}

const panelDir = path.resolve(options.panelDir || process.cwd());
const tailwindConfigPath = path.join(panelDir, 'tailwind.config.js');

function panelRequire(specifier) {
    return require(require.resolve(specifier, { paths: [panelDir, path.join(panelDir, 'node_modules')] }));
}

function bail(message) {
    console.log(`${YELLOW}[SKIP]${RESET} ${message}`);
    process.exit(0);
}

if (!fs.existsSync(tailwindConfigPath)) {
    bail(`No tailwind.config.js in ${panelDir} — nothing to verify.`);
}

let postcss;
let tailwindcss;
let nestingPlugin;
let postcssNesting;
try {
    postcss = panelRequire('postcss');
    tailwindcss = panelRequire('tailwindcss');
    // `tailwindcss/nesting` is how the panel compiles the nested `&` rules in
    // its CSS-module stylesheets (see its postcss.config.js).
    nestingPlugin = panelRequire('tailwindcss/nesting');
    postcssNesting = panelRequire('postcss-nesting');
} catch (error) {
    bail(`Frontend dependencies are not installed in ${panelDir} — run \`yarn install\` there first (${String(error.message).split('\n')[0]}).`);
}

// ---------------------------------------------------------------------------
// 1. Static check: the palette must stay alpha-capable.
// ---------------------------------------------------------------------------
const ALPHA_HOSTILE = /var\(|color-mix\(|env\(|<alpha-value>/i;

function walkColors(node, prefix, visit) {
    if (node === null || node === undefined) return;
    if (typeof node === 'function' || typeof node !== 'object') {
        visit(prefix, node);
        return;
    }
    for (const [key, value] of Object.entries(node)) {
        walkColors(value, prefix ? `${prefix}.${key}` : key, visit);
    }
}

let colorLeafCount = 0;
let config;
try {
    config = require(tailwindConfigPath);
} catch (error) {
    reportFail(`tailwind.config.js could not be loaded: ${error.message}`,
        'The installer replaces this file; reinstall the theme or restore the stock file from your backup.');
    console.log('');
    console.log(`${RED}Aurora Theme: Tailwind color pipeline is broken.${RESET}`);
    process.exit(1);
}

const colors = (config.theme && config.theme.extend && config.theme.extend.colors) || {};
walkColors(colors, '', (key, value) => {
    colorLeafCount += 1;
    const label = `theme.extend.colors.${key}`;
    if (typeof value === 'function') return; // alpha-aware — correct.
    if (typeof value === 'string' && !ALPHA_HOSTILE.test(value)) return; // literal color — fine.
    reportFail(
        `${label} is not alpha-capable: ${typeof value === 'string' ? value : typeof value}`,
        'Wrap the token in alphaColor() (see frontend/overrides/tailwind.config.js). Raw var()/color-mix() ' +
        'strings make Tailwind drop classes like `bg-blue-500/75`, which fails the panel build.'
    );
});

// ---------------------------------------------------------------------------
// 2. Behavioural check: compile the alpha patterns the stock panel uses.
// ---------------------------------------------------------------------------
const PROBE_CSS = `
.aurora-probe {
    @apply bg-blue-500/75 text-blue-200/75;
    @apply bg-gray-500/75 text-gray-200/75;
    @apply bg-red-600/75 text-red-50/75;
    @apply text-primary-500/50 border border-primary-500;
    @apply bg-cyan-500/50 bg-green-500/50 bg-yellow-500/50 bg-amber-500/50;
    @apply ring-primary-400/50 divide-gray-300/50 shadow-primary-500/25;
    @apply bg-neutral-800 text-neutral-200 border-neutral-500;
    @apply bg-aurora-card/50 border-aurora-primary/25 text-aurora-muted/75;
}
`;

async function compileProbe() {
    const plugins = [tailwindcss({ config: tailwindConfigPath, content: [{ raw: PROBE_CSS, extension: 'css' }] })];
    return postcss(plugins).process(PROBE_CSS, { from: path.join(panelDir, '.aurora-probe.css') });
}

async function main() {
    let result;
    try {
        result = await compileProbe();
    } catch (error) {
        reportFail(`Tailwind could not compile the alpha-modifier patterns: ${error.message.split('\n')[0]}`,
            'This is exactly how the stock panel build fails. Keep every color token alpha-aware.');
        return finish();
    }

    const css = result.css || '';
    if (!/var\(--aurora-/.test(css)) {
        reportFail('The compiled probe does not reference any --aurora-* token.',
            'The Aurora palette is not being applied — check theme.extend.colors in tailwind.config.js.');
        return finish();
    }
    if (/<alpha-value>|opacityValue|\[object Object\]/.test(css)) {
        reportFail('The compiled CSS leaked an unresolved template artifact.',
            'A color token is not returning a valid CSS value.');
        return finish();
    }

    ok(`Alpha-modified utilities compile for all palette families (${colorLeafCount} color tokens checked).`);

    // Real stylesheets that triggered the original regression.
    const stockFiles = [
        'resources/scripts/components/elements/button/style.module.css',
        'resources/scripts/components/elements/inputs/styles.module.css',
    ].filter((rel) => fs.existsSync(path.join(panelDir, rel)));

    if (stockFiles.length === 0) {
        warn('Stock button/checkbox stylesheets not found — skipped the file-level check.');
        return finish();
    }

    for (const rel of stockFiles) {
        const abs = path.join(panelDir, rel);
        const source = fs.readFileSync(abs, 'utf8');
        const plugins = [
            tailwindcss({ config: tailwindConfigPath, content: [{ raw: source, extension: 'css' }] }),
            nestingPlugin(postcssNesting),
        ];
        try {
            // eslint-disable-next-line no-await-in-loop
            const out = await postcss(plugins).process(source, { from: abs });
            if (!/var\(--aurora-/.test(out.css || '')) {
                reportFail(`${rel} compiled without Aurora tokens.`);
            } else {
                ok(`${rel} compiles.`);
            }
        } catch (error) {
            reportFail(`${rel}: ${error.message.split('\n')[0]}`,
                'This file is part of the stock panel; its @apply rules must resolve against the Aurora palette.');
        }
    }

    return finish();
}

function finish() {
    console.log('');
    if (failures > 0) {
        console.log(`${RED}Aurora Theme: Tailwind color pipeline is broken (${failures} issue(s)).${RESET}`);
        return 1;
    }
    console.log(`${GREEN}Aurora Theme: Tailwind color pipeline OK.${RESET}`);
    return 0;
}

main()
    .then((code) => process.exit(code))
    .catch((error) => {
        reportFail(`Unexpected error: ${error && error.stack ? error.stack.split('\n')[0] : error}`);
        process.exit(1);
    });
