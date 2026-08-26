// ─────────────────────────────────────────────────────────────
// Gate: the share-card headline number.
//
// The card renderer prints cardStat.value at 104px into an image that gets
// pasted into LinkedIn. This file exists to make the two ways that slot can go
// wrong fail the build instead of shipping:
//
//   1. a record with no cardStat key at all — an oversight, someone added a
//      project and forgot the field;
//   2. a record with a cardStat that is present but unusable — an empty string,
//      a missing unit, a value long enough to overflow the slot.
//
// An explicit `null` is neither. It is a decision, and it must keep passing.
// That is why every presence check here goes through hasOwnProperty rather than
// truthiness: `null` and "absent" are the same to `if (p.cardStat)`, and they
// mean opposite things.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { projects } from '../../src/data/projects.js';

/**
 * Measured for real against the rendered card in tests/gates/card.test.mjs.
 * This is the cheap upstream check that catches an obviously-too-long value at
 * data-authoring time rather than at render time.
 */
const MAX_VALUE_LENGTH = 12;

describe('cardStat — key presence', () => {
  for (const project of projects) {
    test(`${project.slug} declares a cardStat`, () => {
      assert.ok(
        Object.prototype.hasOwnProperty.call(project, 'cardStat'),
        `${project.slug} is missing the cardStat key entirely. Add it. Write an ` +
          `explicit null if this project has no defensible headline number — a null ` +
          `renders the category · status chip and is a legitimate answer. An absent ` +
          `key is not: it means nobody decided.`
      );
    });
  }
});

describe('cardStat — shape when authored', () => {
  for (const project of projects.filter((p) => p.cardStat !== null)) {
    const { value, unit } = project.cardStat;

    test(`${project.slug} has a non-empty value and unit`, () => {
      assert.equal(
        typeof value,
        'string',
        `${project.slug} cardStat.value must be a string; the card prints it verbatim.`
      );
      assert.notEqual(
        value.trim(),
        '',
        `${project.slug} cardStat.value is empty. The card would render a blank ` +
          `headline slot. Write null instead if there is no number to show.`
      );
      assert.equal(
        typeof unit,
        'string',
        `${project.slug} cardStat.unit must be a string.`
      );
      assert.notEqual(
        unit.trim(),
        '',
        `${project.slug} cardStat.unit is empty. A bare number with no unit is ` +
          `an unsourceable claim — "$139K" of what, per what?`
      );
    });

    test(`${project.slug} value fits the headline slot`, () => {
      assert.ok(
        !value.includes('\n'),
        `${project.slug} cardStat.value contains a newline. The headline slot is ` +
          `one line; a newline silently breaks the card layout.`
      );
      assert.ok(
        value.length <= MAX_VALUE_LENGTH,
        `${project.slug} cardStat.value is ${value.length} characters ` +
          `(limit ${MAX_VALUE_LENGTH}). At 104px it will overflow the card. ` +
          `Shorten the value and move the detail into unit.`
      );
    });
  }
});

describe('cardStat — the headline slot can never render empty', () => {
  for (const project of projects) {
    test(`${project.slug} resolves to something printable`, () => {
      // Mirrors what the renderer does: the authored stat, or the D-08 fallback
      // chip built from fields that are non-nullable by schema.
      const rendered =
        project.cardStat === null
          ? `${project.category} · ${project.status}`
          : `${project.cardStat.value} ${project.cardStat.unit}`;

      assert.equal(
        typeof rendered,
        'string',
        `${project.slug} headline slot did not resolve to a string.`
      );
      assert.notEqual(
        rendered.trim(),
        '',
        `${project.slug} would render an empty headline slot. Neither the authored ` +
          `stat nor the category · status fallback produced any text.`
      );
    });
  }
});
