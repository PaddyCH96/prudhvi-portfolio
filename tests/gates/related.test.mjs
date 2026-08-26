// ─────────────────────────────────────────────────────────────
// Gate: the related-projects selector and the derived catalogue counts.
//
// Every case study ends with three related cards. If that selector ever returns
// two, the page ships with a visibly short row and nothing fails — which is why
// the contract is "exactly three or throw", and why it is asserted here for
// every slug rather than spot-checked for one.
//
// The counts are gated in the same file because they fail the same way: quietly.
// featuredProjects is derived, so dropping a featured project silently changes
// the homepage; projectCountWord feeds prose, so a bad value reads as
// "undefined projects" on a live page.
//
// No assertion below hardcodes the catalogue size — that is the number this
// phase just changed, and a test that has to be edited alongside the data it
// guards is not guarding anything. The one literal here is the featured count,
// which is a constraint value (C-1, amended 4 -> 3 by D-24), not a catalogue size.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  projects,
  featuredProjects,
  relatedProjects,
  projectCount,
  projectCountWord,
} from '../../src/data/projects.js';

/** The design contract: a case study shows three related cards. Never two. */
const RELATED_COUNT = 3;

/** C-1 as amended by D-24. The homepage is built for exactly this many. */
const FEATURED_COUNT = 3;

/** Independent derivation, so projectCountWord is checked against meaning. */
const ENGLISH = [
  '',
  'One', 'Two', 'Three', 'Four', 'Five',
  'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
];

const slugs = projects.map((p) => p.slug);

describe('relatedProjects — the three-card contract', () => {
  for (const project of projects) {
    const related = relatedProjects(project.slug);

    test(`${project.slug} gets exactly ${RELATED_COUNT} related projects`, () => {
      assert.equal(
        related.length,
        RELATED_COUNT,
        `${project.slug} would render ${related.length} related cards instead of ` +
          `${RELATED_COUNT}. The row ships visibly short and nothing else fails.`
      );
    });

    test(`${project.slug} is not related to itself`, () => {
      assert.ok(
        !related.some((p) => p.slug === project.slug),
        `${project.slug} links to its own case study from its related row — a ` +
          `self-referential link the reader has nowhere to go from.`
      );
    });

    test(`${project.slug} relates only to real catalogue entries`, () => {
      for (const candidate of related) {
        assert.ok(
          projects.includes(candidate),
          `${project.slug} is related to "${candidate.slug}", which is not an ` +
            `object in the projects array. The selector fabricated a record.`
        );
      }
    });

    test(`${project.slug} puts same-category siblings first`, () => {
      const siblingCount = projects.filter(
        (p) => p.slug !== project.slug && p.category === project.category
      ).length;
      const leading = Math.min(siblingCount, RELATED_COUNT);

      for (let i = 0; i < leading; i += 1) {
        assert.equal(
          related[i].category,
          project.category,
          `${project.slug} (${project.category}) has ${siblingCount} same-category ` +
            `sibling(s), so position ${i} should be one of them, but it is ` +
            `"${related[i].slug}" (${related[i].category}). The most relevant next ` +
            `read is being pushed below a less relevant one.`
        );
      }
    });

    test(`${project.slug} related order is deterministic`, () => {
      const first = relatedProjects(project.slug).map((p) => p.slug);
      const second = relatedProjects(project.slug).map((p) => p.slug);
      assert.deepEqual(
        second,
        first,
        `${project.slug} returned a different order on a second call. The built ` +
          `link graph would change between builds for no reason.`
      );
    });
  }
});

describe('relatedProjects — failure modes', () => {
  test('an unknown slug throws rather than returning a partial list', () => {
    assert.throws(
      () => relatedProjects('does-not-exist'),
      `relatedProjects('does-not-exist') returned instead of throwing. A caller ` +
        `passing a stale slug should fail the build, not silently render an ` +
        `arbitrary three cards.`
    );
  });
});

describe('derived catalogue counts', () => {
  test(`exactly ${FEATURED_COUNT} projects are featured`, () => {
    assert.equal(
      featuredProjects.length,
      FEATURED_COUNT,
      `The homepage is laid out for ${FEATURED_COUNT} featured projects but ` +
        `${featuredProjects.length} carry featured: true ` +
        `(${featuredProjects.map((p) => p.slug).join(', ')}). Adding or removing one ` +
        `changes the homepage silently — decide deliberately, then update C-1.`
    );
  });

  test('featured projects are catalogue members', () => {
    for (const project of featuredProjects) {
      assert.ok(
        slugs.includes(project.slug),
        `Featured project "${project.slug}" is not in the catalogue.`
      );
    }
  });

  test('projectCount tracks the array', () => {
    assert.equal(
      projectCount,
      projects.length,
      `projectCount (${projectCount}) has drifted from projects.length ` +
        `(${projects.length}). Every count printed on the site reads from it.`
    );
  });

  test('projectCountWord spells that same number', () => {
    assert.match(
      projectCountWord,
      /^[A-Z][a-z]+$/,
      `projectCountWord is "${projectCountWord}", which is not a single ` +
        `capitalised English word. It is dropped straight into prose.`
    );
    assert.equal(
      projectCountWord,
      ENGLISH[projectCount],
      `projectCountWord is "${projectCountWord}" but the catalogue holds ` +
        `${projectCount} projects, which is written "${ENGLISH[projectCount]}". ` +
        `The site would print a count that contradicts the page below it.`
    );
  });
});
