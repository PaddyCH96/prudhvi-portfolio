// ─────────────────────────────────────────────────────────────
// Gate: the case-study related row holds the DSGN-04 scale (plan 03-08).
//
// SCOPE. typography.test.mjs and spacing.test.mjs deliberately EXEMPT
// src/pages/projects/[slug].astro: plan 03-07 runs in the same wave and this
// is the only plan that edits this file, so a cross-gate there would make each
// plan's acceptance wait on the other. This file is that exemption's other
// half — the rules plan 03-08 rewrites are gated here, and nowhere else.
//
// Gated by SELECTOR, not by file. Phase 03 declines a page-wide re-typeset of
// the case study, so a file-wide matcher would be red on rules nobody is
// allowed to touch. Every exemption carries its reason inline.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { stylesheetOf, rulesOf } from '../helpers/css.mjs';

const SOURCE = 'src/pages/projects/[slug].astro';

/** Exactly the rules plan 03-08 rewrites. */
const GATED = [
  '.more',
  '.more-card',
  '.more-card:hover',
  '.more-label',
  '.more-tag',
  '.more-name',
  '.more-sum',
  '.all-projects',
];

/** Not gated here, each with the reason it is out of scope. */
const EXEMPT = [
  ['.back', 'header back-link — untouched by 03-08; still carries 14px and an 11px optical inset'],
  ['.meta li', 'header chips — untouched by 03-08; still carries 12px'],
  ['h1', 'case-study title — this plan retunes the related row, not the page masthead'],
  ['.lead', 'standfirst — untouched by 03-08; still carries 19px'],
  ['.body', 'case-study prose — a reading measure at 17px/1.7, out of scope for the role scale'],
  ['.proof li', 'detail list — untouched by 03-08; still carries 15.5px'],
  ['.proof h3 (.stack-label)', 'stack label — already Label-shaped, but not rewritten by this plan'],
  ['the two media-query .lead overrides', 'responsive standfirst sizing — moves only when .lead does'],
];

const ALLOWED_SIZES = new Set(['20px', '16px', '13px']);
const ALLOWED_WEIGHTS = new Set(['400', '600']);

/** The exact pre-phase values this plan replaces. Their absence proves the retune landed. */
const RETIRED = ['11.5px', '13.5px', '15.5px', '14px'];

/**
 * True when a rule's selector list touches any gated selector.
 * @param {string} selector
 * @returns {boolean}
 */
function isGated(selector) {
  return GATED.some((g) =>
    new RegExp(`(^|[\\s,>+~])${g.replace(/[.:]/g, '\\$&')}(?![\\w-])`).test(selector)
  );
}

const gatedRules = rulesOf(stylesheetOf(SOURCE)).filter((r) => isGated(r.selector));

/**
 * Every px component of a padding / margin / gap shorthand, parsed individually.
 * @param {string} body
 * @returns {{prop: string, value: number, raw: string}[]}
 */
function spacingValues(body) {
  const out = [];
  for (const m of body.matchAll(/(^|[\s;])((?:row-|column-)?gap|margin|padding)\s*:\s*([^;]+)/g)) {
    for (const px of m[3].matchAll(/(-?[\d.]+)px/g)) {
      out.push({ prop: m[2], value: Number(px[1]), raw: m[3].trim() });
    }
  }
  return out;
}

describe('case study — the related row holds the role scale (DSGN-04)', () => {
  test('the gated selector set actually matched rules', () => {
    assert.ok(
      gatedRules.length >= GATED.length,
      `only ${gatedRules.length} gated rules matched in ${SOURCE}, expected at least ` +
        `${GATED.length}. The related row was renamed or deleted and this gate has quietly ` +
        `stopped gating anything. Exempt by design: ${EXEMPT.map(([s]) => s).join(', ')}.`
    );
  });

  test('no font-size outside {20px, 16px, 13px}', () => {
    for (const rule of gatedRules) {
      for (const m of rule.body.matchAll(/font-size\s*:\s*([^;]+)/g)) {
        const value = m[1].trim();
        assert.ok(
          ALLOWED_SIZES.has(value),
          `${SOURCE} → "${rule.selector}" declares font-size: ${value}. The related row ` +
            `reaches three of the four role sizes (${[...ALLOWED_SIZES].join(', ')}) — there ` +
            `is no Display type down here. Snap it to a role token.`
        );
      }
    }
  });

  test('no font-weight outside {400, 600}', () => {
    for (const rule of gatedRules) {
      for (const m of rule.body.matchAll(/font-weight\s*:\s*([^;]+)/g)) {
        const value = m[1].trim();
        assert.ok(
          ALLOWED_WEIGHTS.has(value),
          `${SOURCE} → "${rule.selector}" declares font-weight: ${value}. Exactly two ` +
            `weights ship: 400 and 600.`
        );
      }
    }
  });

  test('the retired pre-phase values appear in zero gated rules', () => {
    for (const rule of gatedRules) {
      for (const bad of RETIRED) {
        const hit = new RegExp(`(?<![\\d.])${bad.replace('.', '\\.')}`).test(rule.body);
        assert.ok(
          !hit,
          `${SOURCE} → "${rule.selector}" still carries ${bad}. That is a pre-phase value ` +
            `plan 03-08 replaces; its presence means the retune was reverted in part.`
        );
      }
    }
  });

  test('every padding, margin and gap is a multiple of 4', () => {
    for (const rule of gatedRules) {
      for (const { prop, value, raw } of spacingValues(rule.body)) {
        assert.equal(
          Math.abs(value) % 4,
          0,
          `${SOURCE} → "${rule.selector}" declares ${prop}: ${raw}, and ${value}px is off the ` +
            `4px rhythm. Every spacing value on a surface this phase edits is a multiple of 4.`
        );
      }
    }
  });

  test('height is declared, never accumulated from padding (C-9)', () => {
    const heights = [
      ['.more-card', '88px', 'twice the 44px control floor'],
      ['.all-projects a', '44px', 'the WCAG 2.5.5 control floor'],
    ];
    for (const [selector, expected, why] of heights) {
      const rule = gatedRules.find((r) => r.selector === selector);
      assert.ok(rule, `${SOURCE} has no "${selector}" rule — this gate expects one.`);
      const m = /min-height\s*:\s*([^;]+)/.exec(rule.body);
      assert.ok(
        m,
        `${SOURCE} → "${selector}" declares no min-height. Height comes from a declared value, ` +
          `never from padding arithmetic (C-9, Prohibition 9). Expected ${expected} — ${why}.`
      );
      assert.equal(
        m[1].trim(),
        expected,
        `${SOURCE} → "${selector}" declares min-height: ${m[1].trim()}, expected ${expected} (${why}).`
      );
    }
  });

  test('the three related-row breakpoints are unchanged', () => {
    const css = stylesheetOf(SOURCE);
    for (const [query, columns] of [
      [null, 'repeat(3, 1fr)'],
      ['max-width: 860px', 'repeat(2, 1fr)'],
      ['max-width: 560px', '1fr'],
    ]) {
      assert.ok(
        css.includes(`grid-template-columns: ${columns}`),
        `${SOURCE} lost the ${query ?? 'base'} related-row layout ` +
          `(grid-template-columns: ${columns}). Plan 03-08 retunes the row's type and rhythm ` +
          `and leaves its breakpoints exactly as they were.`
      );
    }
  });
});
