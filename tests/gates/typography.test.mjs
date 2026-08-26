// ─────────────────────────────────────────────────────────────
// Gate: the site holds at exactly four font sizes and two font weights
// on every surface this phase retypesets (DSGN-04).
//
// SCOPE. This gate is scoped by CSS SELECTOR, not by file. Phase 03
// deliberately declines a site-wide retypeset — "blocks this phase does not
// edit keep their current values" — so a file-wide matcher would be red on
// rules nobody is allowed to touch. The gated set is declared as a const
// below, and every exemption carries its reason inline, so widening either is
// a visible edit rather than a silent skip.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

import { GATED, EXEMPT, SOURCE, stylesheetOf, rulesOf, isGated } from '../helpers/css.mjs';

const ALLOWED_SIZES = new Set(['clamp(34px, 4.6vw, 48px)', '20px', '16px', '13px']);
const ALLOWED_WEIGHTS = new Set(['400', '600']);

/**
 * Every .astro/.css file under src/, for the one site-wide assertion.
 * @param {string} dir
 * @returns {string[]}
 */
function stylesheetsUnderSrc(dir = 'src') {
  return readdirSync(dir)
    .flatMap((f) => {
      const p = `${dir}/${f}`;
      return statSync(p).isDirectory() ? stylesheetsUnderSrc(p) : [p];
    })
    .filter((p) => p.endsWith('.astro') || p.endsWith('.css'));
}

const gatedRules = rulesOf(stylesheetOf(SOURCE)).filter((r) => isGated(r.selector));

describe('typography — four sizes, two weights, over the gated hero selectors', () => {
  test('the gated selector set actually matched rules', () => {
    assert.ok(
      gatedRules.length >= 10,
      `only ${gatedRules.length} gated rules matched in ${SOURCE}. The hero was renamed or ` +
        `deleted and this gate has quietly stopped gating anything.`
    );
  });

  test('no font-size outside {Display, 20px, 16px, 13px}', () => {
    for (const rule of gatedRules) {
      for (const m of rule.body.matchAll(/font-size\s*:\s*([^;]+);/g)) {
        const value = m[1].trim().replace(/\s*,\s*/g, ', ');
        assert.ok(
          ALLOWED_SIZES.has(value),
          `${SOURCE} → "${rule.selector}" declares font-size: ${value}. The site holds at ` +
            `exactly four sizes: ${[...ALLOWED_SIZES].join(', ')}. Snap it to a role token.`
        );
      }
    }
  });

  test('no font-weight outside {400, 600}', () => {
    for (const rule of gatedRules) {
      for (const m of rule.body.matchAll(/font-weight\s*:\s*([^;]+);/g)) {
        const value = m[1].trim();
        assert.ok(
          ALLOWED_WEIGHTS.has(value),
          `${SOURCE} → "${rule.selector}" declares font-weight: ${value}. Exactly two weights ` +
            `ship: 400 and 600. On an element this phase edits, 500 becomes 600.`
        );
      }
    }
  });
});

describe('the withdrawn 24px exception is gone site-wide', () => {
  // Safe to assert everywhere: .stat-v was 24px's only occurrence in any
  // stylesheet, and plan 03-07 removed it. No exemption is needed.
  for (const path of stylesheetsUnderSrc()) {
    test(`${path} declares no font-size: 24px`, () => {
      assert.equal(
        /font-size\s*:\s*24px/.test(stylesheetOf(path)),
        false,
        `${path} declares font-size: 24px. That exception is withdrawn — the hero stat value ` +
          `is Heading (20px/600). If a value needs more presence, raise it to Display; never ` +
          `invent a size between 20 and 34.`
      );
    });
  }
});

describe('exemptions are recorded, not silent', () => {
  test('every exemption carries a reason', () => {
    for (const [what, why] of EXEMPT) {
      assert.ok(why && why.length > 20, `exemption "${what}" has no substantive reason recorded.`);
    }
  });

  test('this gate does not read the file plan 03-08 owns', () => {
    const self = readFileSync('tests/gates/typography.test.mjs', 'utf8');
    const owned = EXEMPT.find(([w]) => w.includes('[slug].astro'));
    assert.ok(owned, 'src/pages/projects/[slug].astro must appear in EXEMPT with its owner named.');
    assert.match(owned[1], /03-08/, 'the exemption must name plan 03-08 as the owner.');
    assert.equal(
      /readFileSync\(\s*['"`]src\/pages\/projects\/\[slug\]\.astro/.test(self),
      false,
      'typography.test.mjs must not read src/pages/projects/[slug].astro; 03-08 owns it.'
    );
  });
});
