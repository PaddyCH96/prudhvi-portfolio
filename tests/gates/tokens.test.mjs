// ─────────────────────────────────────────────────────────────
// Gate: C-10 token integrity across the three theme blocks.
//
// Two things are load-bearing here and neither is a convention:
//
// 1. --series-1 and --accent-warm are a CVD-validated pair. They are diffed
//    BYTE-FOR-BYTE against tests/baseline/tokens.baseline.json, captured
//    pre-phase in plan 03-01 for exactly this purpose. A design pass that
//    recolours, swaps or merges either one fails here, naming the block.
//
// 2. The hero field's published contrast floors are RECOMPUTED from the
//    declared --hero-tint-* / --hero-veil / --hero-grain values rather than
//    trusted. UI-SPEC § Color hard rule 6 says the alphas and the floor are
//    one artefact; this is what makes that self-enforcing. Change an alpha
//    without republishing the table and the gate fails.
//
// Comments are stripped before any matching, so a comment that names a token
// can never satisfy a presence check.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { composite, contrastRatio } from '../helpers/contrast.mjs';

const SOURCE = readFileSync(new URL('../../src/layouts/Base.astro', import.meta.url), 'utf8');
const BASELINE = JSON.parse(
  readFileSync(new URL('../baseline/tokens.baseline.json', import.meta.url), 'utf8')
);

/** Strip every block and line comment, so comment prose cannot satisfy a match. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

/** Return the body of the brace-delimited block whose opening brace follows `from`. */
function braceBody(css, from) {
  const open = css.indexOf('{', from);
  assert.notEqual(open, -1, 'no opening brace found for a theme block');
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error('unbalanced braces in src/layouts/Base.astro');
}

/**
 * The three theme selectors, keyed by the baseline's own block names so the
 * byte-identity diff lines up without a second mapping.
 */
function themeBlocks() {
  const css = stripComments(SOURCE);

  const rootAt = css.search(/(^|\n)\s*:root\s*\{/);
  assert.notEqual(rootAt, -1, ':root block not found in Base.astro');

  const mediaAt = css.indexOf('@media (prefers-color-scheme: dark)');
  assert.notEqual(mediaAt, -1, 'prefers-color-scheme: dark block not found in Base.astro');
  const guardAt = css.indexOf(':root:where(:not([data-theme="light"]))', mediaAt);
  assert.notEqual(
    guardAt,
    -1,
    'the dark block lost its :where(:not([data-theme="light"])) guard — an explicit ' +
      'light override would stop beating the OS preference.'
  );

  const explicitAt = css.indexOf(':root[data-theme="dark"]');
  assert.notEqual(explicitAt, -1, ':root[data-theme="dark"] block not found in Base.astro');

  return {
    root: braceBody(css, rootAt),
    prefersDark: braceBody(css, guardAt),
    dataThemeDark: braceBody(css, explicitAt),
  };
}

/** Parse `--name: value;` declarations out of one block body. */
function declarations(body) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out[match[1]] = match[2].trim();
  }
  return out;
}

/** Contrast ratios are published to two decimal places; compare them there. */
function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Human-readable selector for each block, used in the C-10 failure text. */
const SELECTOR = {
  root: ':root',
  prefersDark: 'prefers-color-scheme: dark',
  dataThemeDark: '[data-theme="dark"]',
};

const BLOCKS = themeBlocks();
const DECLS = Object.fromEntries(
  Object.entries(BLOCKS).map(([name, body]) => [name, declarations(body)])
);
const BLOCK_NAMES = Object.keys(SELECTOR);

const HERO_TOKENS = [
  '--hero-tint-a',
  '--hero-tint-b',
  '--hero-veil',
  '--hero-grain',
  '--hero-edge',
  '--hero-shadow',
  '--hero-tile',
  '--hero-tile-ink',
  '--hero-drift',
];

/** Theme-invariant by decision (D-15), not by accident. */
const INVARIANT = {
  '--hero-tile': '#161615',
  '--hero-tile-ink': '#f4f3ef',
  '--hero-drift': '34s',
};

describe('the --hero-* family is declared in all three theme blocks (C-10)', () => {
  for (const name of BLOCK_NAMES) {
    for (const token of HERO_TOKENS) {
      test(`${token} in ${SELECTOR[name]}`, () => {
        assert.ok(
          DECLS[name][token],
          `Token ${token} is missing from ${SELECTOR[name]}. C-10 requires every ` +
            `token in :root, prefers-color-scheme: dark, and [data-theme="dark"].`
        );
      });
    }
  }

  test('that is 27 declarations, three per token', () => {
    const total = BLOCK_NAMES.reduce(
      (sum, name) => sum + HERO_TOKENS.filter((t) => DECLS[name][t]).length,
      0
    );
    assert.equal(total, HERO_TOKENS.length * BLOCK_NAMES.length);
  });
});

describe('the theme-invariant tokens hold one value everywhere (D-15)', () => {
  for (const [token, expected] of Object.entries(INVARIANT)) {
    test(`${token} is ${expected} in every block`, () => {
      for (const name of BLOCK_NAMES) {
        assert.equal(
          DECLS[name][token],
          expected,
          `${token} is '${DECLS[name][token]}' in ${SELECTOR[name]}. It is ` +
            `theme-invariant: the favicon tile must read identically on a light or ` +
            `a dark tab strip, and the ICO and apple-touch fallbacks cannot honour ` +
            `a theme-responsive icon anyway.`
        );
      }
    });
  }
});

describe('the CVD-validated pair is byte-identical to the pre-phase baseline (C-10)', () => {
  for (const name of BLOCK_NAMES) {
    for (const token of ['--series-1', '--accent-warm']) {
      test(`${token} in ${SELECTOR[name]}`, () => {
        assert.equal(
          DECLS[name][token],
          BASELINE[name][token],
          `${token} in ${SELECTOR[name]} is '${DECLS[name][token]}', baseline is ` +
            `'${BASELINE[name][token]}'. These two are a CVD-validated pair — they ` +
            `must not be swapped, recoloured, merged into --link or reused as ` +
            `decoration. Restore the baseline value; do not update the baseline.`
        );
      });
    }
  }
});

describe('the published hero composite floors recompute from the shipped values', () => {
  // UI-SPEC § Color: the worst animation frame is opacity 1.0, where veil and
  // grain are at full strength. Light text sits on the composite over the
  // DARKER stop; dark-mode light text sits on the composite over the LIGHTER
  // stop. Both are worst case for their own mode.
  const light = composite(
    composite(DECLS.root['--hero-tint-b'], DECLS.root['--hero-veil']),
    DECLS.root['--hero-grain']
  );
  const dark = composite(
    composite(DECLS.dataThemeDark['--hero-tint-a'], DECLS.dataThemeDark['--hero-veil']),
    DECLS.dataThemeDark['--hero-grain']
  );

  test('the composites are the published colours', () => {
    assert.equal(light, '#deddd7', 'the light hero composite moved off its published value.');
    assert.equal(dark, '#272726', 'the dark hero composite moved off its published value.');
  });

  test('--text-secondary clears the published floor on both composites', () => {
    // Compared at the precision the floors are PUBLISHED at. The raw dark ratio
    // is 8.34548, which rounds to the published 8.35 but is a hair under it at
    // full precision — comparing raw against a 2-dp constant would fail on a
    // rounding artefact rather than on a real contrast regression.
    const lightRatio = round2(contrastRatio(DECLS.root['--text-secondary'], light));
    const darkRatio = round2(contrastRatio(DECLS.dataThemeDark['--text-secondary'], dark));
    assert.ok(
      lightRatio >= 5.83,
      `light hero floor is ${lightRatio.toFixed(2)}:1, published as 5.83:1. The ` +
        `alphas and the floor are one artefact — recompute and republish the ` +
        `composite table in 03-UI-SPEC § Color before this lands.`
    );
    assert.ok(
      darkRatio >= 8.35,
      `dark hero floor is ${darkRatio.toFixed(2)}:1, published as 8.35:1. Recompute ` +
        `and republish the composite table before this lands.`
    );
  });

  test('--muted and --link are arithmetically below AA on the field, not merely banned', () => {
    for (const token of ['--muted', '--link']) {
      const lightRatio = contrastRatio(DECLS.root[token], light);
      const darkRatio = contrastRatio(DECLS.dataThemeDark[token], dark);
      assert.ok(
        lightRatio < 4.5,
        `${token} now measures ${lightRatio.toFixed(2)}:1 on the light hero composite. ` +
          `The prohibition in Color rule 1 is justified by this number — if it changed, ` +
          `the rule and its reasoning both need revisiting, not the test.`
      );
      assert.ok(
        darkRatio < 4.5,
        `${token} now measures ${darkRatio.toFixed(2)}:1 on the dark hero composite.`
      );
    }
  });
});

describe('the dark blocks agree with each other', () => {
  test('every token declared in one dark block is declared in the other, identically', () => {
    const keys = new Set([
      ...Object.keys(DECLS.prefersDark),
      ...Object.keys(DECLS.dataThemeDark),
    ]);
    for (const token of keys) {
      assert.equal(
        DECLS.prefersDark[token],
        DECLS.dataThemeDark[token],
        `${token} differs between the OS-preference dark block and the explicit ` +
          `[data-theme="dark"] block. The theme toggle and the OS preference must ` +
          `resolve to the same palette.`
      );
    }
  });
});
