// ─────────────────────────────────────────────────────────────
// Gate: the --accent-* family (D-17).
//
// The neon lime carries brand identity. It must not be allowed to drift into
// the two roles that are already spoken for: --series-1 is a CVD-validated
// data mark and --link is interaction. Neither is touched here.
//
// Two things are load-bearing:
//
// 1. --accent-panel is a FILL, never text. Lime measures 1.09:1 on the light
//    plane, so lime-as-text on a light ground is not a style preference, it is
//    unreadable. The gate asserts the lime never appears as a text colour and
//    that the panel pair is theme-invariant (D-15) — a lime panel with dark ink
//    on it reads identically in both themes, which is the whole reason the
//    dual-theme toggle survives the redesign.
//
// 2. The published floors are RECOMPUTED from the declared values rather than
//    trusted, in the same spirit as the hero field in tokens.test.mjs. Darken
//    the lime or lighten the olive past the floor and this fails rather than
//    shipping.
//
// Comments are stripped before any matching, so a comment that names a token
// can never satisfy a presence check.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { contrastRatio } from '../helpers/contrast.mjs';

const SOURCE = readFileSync(new URL('../../src/layouts/Base.astro', import.meta.url), 'utf8');

const ACCENT_TOKENS = ['--accent-panel', '--accent-panel-ink', '--accent-ink'];

/** Theme-invariant by decision (D-15), not by accident. */
const INVARIANT = {
  '--accent-panel': '#d5ff3f',
  '--accent-panel-ink': '#161b22',
};

/** AAA. The rest of this system holds to it; the accent does not get an exemption. */
const FLOOR = 7;

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

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

function declarations(body) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out[match[1]] = match[2].trim();
  }
  return out;
}

const CSS = stripComments(SOURCE);

const SELECTOR = {
  root: ':root',
  prefersDark: 'prefers-color-scheme: dark',
  dataThemeDark: '[data-theme="dark"]',
};

const DECLS = {
  root: declarations(braceBody(CSS, CSS.search(/(^|\n)\s*:root\s*\{/))),
  prefersDark: declarations(
    braceBody(
      CSS,
      CSS.indexOf(
        ':root:where(:not([data-theme="light"]))',
        CSS.indexOf('@media (prefers-color-scheme: dark)')
      )
    )
  ),
  dataThemeDark: declarations(braceBody(CSS, CSS.indexOf(':root[data-theme="dark"]'))),
};

const BLOCK_NAMES = Object.keys(SELECTOR);

describe('the --accent-* family is declared in all three theme blocks (C-10)', () => {
  for (const name of BLOCK_NAMES) {
    for (const token of ACCENT_TOKENS) {
      test(`${token} in ${SELECTOR[name]}`, () => {
        assert.ok(
          DECLS[name][token],
          `Token ${token} is missing from ${SELECTOR[name]}. C-10 requires every ` +
            `token in :root, prefers-color-scheme: dark, and [data-theme="dark"].`
        );
      });
    }
  }

  test('that is 9 declarations, three per token', () => {
    const total = BLOCK_NAMES.reduce(
      (sum, name) => sum + ACCENT_TOKENS.filter((t) => DECLS[name][t]).length,
      0
    );
    assert.equal(total, ACCENT_TOKENS.length * BLOCK_NAMES.length);
  });
});

describe('the lime panel pair is theme-invariant (D-15)', () => {
  for (const [token, expected] of Object.entries(INVARIANT)) {
    test(`${token} is ${expected} in every block`, () => {
      for (const name of BLOCK_NAMES) {
        assert.equal(
          DECLS[name][token],
          expected,
          `${token} is ${DECLS[name][token]} in ${SELECTOR[name]}, expected ${expected}. ` +
            `The lime panel is a fill with dark ink on it and must read identically in ` +
            `both themes — that invariance is what lets the theme toggle survive the ` +
            `redesign. Do not make this token theme-responsive.`
        );
      }
    });
  }
});

describe('the published accent floors are recomputed, not trusted', () => {
  test('ink on the lime panel clears AAA', () => {
    const ratio = contrastRatio(INVARIANT['--accent-panel-ink'], INVARIANT['--accent-panel']);
    assert.ok(
      ratio >= FLOOR,
      `--accent-panel-ink on --accent-panel measures ${ratio.toFixed(2)}:1, under the ` +
        `${FLOOR}:1 floor. This pair is the most-used surface in the redesign.`
    );
  });

  test('--accent-ink clears AAA on both surfaces, in every block', () => {
    for (const name of BLOCK_NAMES) {
      const ink = DECLS[name]['--accent-ink'];
      for (const surface of ['--plane', '--surface-1']) {
        const bg = DECLS[name][surface];
        const ratio = contrastRatio(ink, bg);
        assert.ok(
          ratio >= FLOOR,
          `--accent-ink (${ink}) on ${surface} (${bg}) in ${SELECTOR[name]} measures ` +
            `${ratio.toFixed(2)}:1, under the ${FLOOR}:1 floor.`
        );
      }
    }
  });
});

describe('the lime never becomes text on a light ground', () => {
  test('--accent-ink in :root is not the lime', () => {
    assert.notEqual(
      DECLS.root['--accent-ink'].toLowerCase(),
      INVARIANT['--accent-panel'].toLowerCase(),
      `--accent-ink in :root is the neon lime. On the light plane that measures ` +
        `1.09:1 — invisible, not merely low-contrast. Light mode uses the darkened ` +
        `olive; the lime is a panel fill only.`
    );
  });

  test('the lime is arithmetically unusable as light-mode text, not merely banned', () => {
    const ratio = contrastRatio(INVARIANT['--accent-panel'], DECLS.root['--plane']);
    assert.ok(
      ratio < 4.5,
      `The lime now measures ${ratio.toFixed(2)}:1 on the light plane. If the plane or ` +
        `the lime has moved far enough for this to pass AA, the reasoning behind the ` +
        `panel-fill-only rule needs revisiting rather than the rule being quietly kept.`
    );
  });
});
