// ─────────────────────────────────────────────────────────────
// Gate: the 4-point rhythm, and control height that is DECLARED rather than
// computed from padding (DSGN-04 / C-9).
//
// C-9 asks for a 44px tap target. A prior attempt expressed that as
// `padding: 11px 0` around a 21px line box and landed on 43px — a rounding
// error the eye cannot see and a gate cannot infer. So this file asserts two
// things that together make the defect impossible: every px value is a
// multiple of 4, and every interactive control declares min-height: 44px.
//
// SCOPE. Selector-scoped, not file-scoped, for the reason recorded in
// typography.test.mjs: this phase re-spaces the hero and explicitly leaves
// every other block at its current values. `padding: 11px` still survives on
// .card-links a, which this phase does not edit — that is precisely why the
// rule is scoped rather than file-wide.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { stylesheetOf, rulesOf, isGated, GATED, EXEMPT, SOURCE } from '../helpers/css.mjs';


/** Gated selectors that are interactive controls and must declare a height. */
const GATED_CONTROLS = ['.hero-cta', '.hero-secondary a', '.see-all a'];

/** Declarations whose px components are on the 4-point scale. */
const SPACED_PROPS = /^(padding|margin|gap|row-gap|column-gap)(-(top|right|bottom|left))?$/;

/**
 * Grandfathered values, both themselves multiples of 4 and so needing no
 * exemption from the rule — recorded here only so the reader knows they were
 * considered: 40px section padding at <=640px, 72px OG card padding.
 */
const GRANDFATHERED = [40, 72];

const css = stylesheetOf(SOURCE);
const rules = rulesOf(css);
const gatedRules = rules.filter((r) => isGated(r.selector));

/**
 * Every px number in a declaration value, shorthand included. Negative values
 * are measured by magnitude — a -11px margin is the same authoring defect.
 * @param {string} value
 * @returns {number[]}
 */
function pxValuesOf(value) {
  return [...value.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => Math.abs(Number(m[1])));
}

/**
 * Spacing declarations of one rule, as { prop, value } pairs.
 * @param {string} body
 * @returns {{prop: string, value: string}[]}
 */
function spacingDeclsOf(body) {
  const out = [];
  for (const m of body.matchAll(/([a-z-]+)\s*:\s*([^;]+);/g)) {
    if (SPACED_PROPS.test(m[1].trim())) out.push({ prop: m[1].trim(), value: m[2].trim() });
  }
  return out;
}

describe('spacing — the 4-point rhythm over the gated hero selectors', () => {
  test('the gated selector set actually matched rules', () => {
    assert.ok(
      gatedRules.length >= 10,
      `only ${gatedRules.length} gated rules matched in ${SOURCE}; this gate has stopped gating.`
    );
  });

  test('every padding, margin and gap px value is a multiple of 4', () => {
    for (const rule of gatedRules) {
      for (const { prop, value } of spacingDeclsOf(rule.body)) {
        for (const px of pxValuesOf(value)) {
          assert.equal(
            px % 4,
            0,
            `${SOURCE} → "${rule.selector}" declares ${prop}: ${value}, and ${px}px is not on ` +
              `the 4-point scale (4 · 8 · 16 · 24 · 32 · 48 · 64). ` +
              (GRANDFATHERED.includes(px)
                ? `(${px}px is grandfathered elsewhere, but only outside the gated set.)`
                : '')
          );
        }
      }
    }
  });

  test('padding: 11px appears in zero gated rules', () => {
    for (const rule of gatedRules) {
      assert.equal(
        /padding[^;]*\b11px/.test(rule.body),
        false,
        `${SOURCE} → "${rule.selector}" still carries the deleted 11px control padding. ` +
          `Height is declared with min-height: 44px, never computed from padding arithmetic.`
      );
    }
  });
});

describe('C-9 — control height is declared, never computed', () => {
  for (const control of GATED_CONTROLS) {
    const rule = gatedRules.find((r) =>
      r.selector.split(',').some((s) => s.trim() === control)
    );

    test(`${control} exists in the gated stylesheet`, () => {
      assert.ok(
        rule,
        `no rule for "${control}" in ${SOURCE}. Either the control was renamed — update ` +
          `GATED_CONTROLS — or it lost its own rule and inherited an undeclared height.`
      );
    });

    test(`${control} declares min-height: 44px`, () => {
      assert.ok(rule, `no rule for "${control}".`);
      assert.match(
        rule.body,
        /min-height\s*:\s*44px/,
        `"${control}" does not declare min-height: 44px. C-9's floor must be stated, not ` +
          `inferred from line-height plus padding — that is how a prior attempt landed on 43px.`
      );
    });

    test(`${control} centres its label rather than padding it to height`, () => {
      assert.ok(rule, `no rule for "${control}".`);
      assert.match(
        rule.body,
        /display\s*:\s*inline-flex/,
        `"${control}" must be inline-flex so min-height can centre the label.`
      );
      assert.match(
        rule.body,
        /align-items\s*:\s*center/,
        `"${control}" must centre its label vertically inside the declared height.`
      );
    });

    test(`${control} has no odd px padding`, () => {
      assert.ok(rule, `no rule for "${control}".`);
      for (const m of rule.body.matchAll(/padding[a-z-]*\s*:\s*([^;]+);/g)) {
        for (const px of pxValuesOf(m[1])) {
          assert.equal(
            px % 2,
            0,
            `"${control}" declares an odd padding of ${px}px. An odd padding is the signature ` +
              `of a height derived by arithmetic; the height here comes from min-height.`
          );
        }
      }
    });
  }
});

describe('the scope of this gate is declared, not implicit', () => {
  test('the gated and exempt sets are both non-empty and reasoned', () => {
    assert.ok(GATED.length > 0, 'GATED is empty; nothing is being gated.');
    assert.ok(EXEMPT.length > 0, 'EXEMPT is empty; the scope decision has been lost.');
    for (const [what, why] of EXEMPT) {
      assert.ok(why && why.length > 20, `exemption "${what}" has no substantive reason recorded.`);
    }
  });

  test('.card-links is exempt, and that is why 11px survives there', () => {
    assert.ok(
      EXEMPT.some(([w]) => w === '.card-links'),
      '.card-links must stay in EXEMPT — this phase does not edit it, and it still carries 11px.'
    );
    assert.equal(
      isGated('.card-links a'),
      false,
      '.card-links a must not be gated; gating it would fail on a rule nobody may touch.'
    );
  });
});
