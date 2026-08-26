// ─────────────────────────────────────────────────────────────
// Gate: the share-card route record contract, at the data level.
//
// The complementary check — that the built HTML actually carries the tags —
// lives in tests/gates/og.test.mjs and reads dist/. This file reads nothing
// under dist/; it asserts the table before anything renders from it.
//
// One rule governs every assertion here: NO ROUTE COUNT IS EVER PINNED TO A
// LITERAL. Completeness is asserted relative to the data — staticRoutes.length
// + projects.length — because src/content/blog/hello.md is one `draft: false`
// away from adding a route. A hardcoded expectation would turn publishing a
// post into a build failure that names none of the actual cause
// (03-VALIDATION.md § Open Risk).
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ogRoutes, staticRoutes, projectRoutes, OG_ALT_MAX } from '../../src/data/og-routes.js';
import { projects } from '../../src/data/projects.js';

/** A synthetic collection in the shape getCollection('blog') returns. */
const POSTS = [
  {
    id: 'what-mape-meant',
    data: {
      title: 'What 0.8% MAPE actually meant',
      description: 'x',
      date: new Date('2026-08-24'),
      tags: [],
      draft: false,
    },
  },
  {
    id: 'forecasting-a-contact-centre.md',
    data: {
      title: 'Forecasting a contact centre',
      description: 'y',
      date: new Date('2026-07-01'),
      tags: [],
      draft: false,
    },
  },
];

describe('route completeness is derived, never pinned', () => {
  test('every static and project route has a record', () => {
    const all = ogRoutes();
    assert.equal(
      Object.keys(all).length,
      staticRoutes.length + projects.length,
      'the record count no longer matches the data it derives from. Do not fix this ' +
        'by editing an expected number — find the route that lost its record.'
    );
  });

  test('every project has a record at its own pathname', () => {
    const all = ogRoutes();
    for (const project of projects) {
      assert.ok(
        all[`/projects/${project.slug}/`],
        `${project.slug} is in the catalogue but has no share-card record. It will ` +
          `ship with no og:image.`
      );
    }
  });

  test('projectRoutes tracks the catalogue one-for-one', () => {
    assert.equal(projectRoutes.length, projects.length);
  });
});

describe('every record satisfies the OgRoute contract', () => {
  const all = Object.entries(ogRoutes(POSTS));

  for (const [path, rec] of all) {
    test(`${path} is well formed`, () => {
      assert.ok(path.endsWith('/'), `${path} has no trailing slash (C-6).`);
      assert.equal(rec.path, path, 'the record key and its own path disagree.');
      assert.match(
        rec.slug,
        /^[a-z0-9-]+$/,
        `slug '${rec.slug}' is not [a-z0-9-]. It is composed into a ` +
          `public/og/<slug>.png write path — fix the slug, not the pattern.`
      );
      for (const key of ['eyebrow', 'title', 'slot', 'alt']) {
        assert.ok(
          rec[key] && String(rec[key]).trim(),
          `${key} is empty on ${path}. The headline slot can never render empty (D-08).`
        );
      }
      assert.ok(
        rec.alt.length <= OG_ALT_MAX,
        `alt on ${path} is ${rec.alt.length} chars, over the ${OG_ALT_MAX} budget.`
      );
      assert.ok(
        rec.unit === null || (typeof rec.unit === 'string' && rec.unit.trim()),
        `unit on ${path} must be a non-empty string or an explicit null.`
      );
    });
  }

  test('slugs are unique across every record', () => {
    const slugs = all.map(([, rec]) => rec.slug);
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    assert.deepEqual(
      [...new Set(dupes)],
      [],
      'two routes share a slug. They would write the same public/og/<slug>.png and ' +
        'one card would silently overwrite the other.'
    );
  });
});

describe('headline slot follows the D-08 resolution order', () => {
  const all = ogRoutes();

  for (const project of projects) {
    test(`${project.slug} resolves its slot from cardStat`, () => {
      const rec = all[`/projects/${project.slug}/`];
      if (project.cardStat === null) {
        assert.equal(
          rec.slot,
          `${project.category} · ${project.status}`,
          'a null cardStat is a decision, and it renders the category · status chip.'
        );
        assert.equal(rec.unit, null);
      } else {
        assert.equal(rec.slot, project.cardStat.value);
        assert.equal(rec.unit, project.cardStat.unit);
      }
    });
  }
});

describe('blog records derive from the collection passed in', () => {
  test('passing posts adds exactly one record per post', () => {
    const base = Object.keys(ogRoutes()).length;
    const withPosts = Object.keys(ogRoutes(POSTS)).length;
    assert.equal(
      withPosts - base,
      POSTS.length,
      'publishing a post must add a record. If this fails, the blog branch is ' +
        'enumerating routes instead of deriving them.'
    );
  });

  test('a post record is keyed by its own pathname, extension stripped', () => {
    const all = ogRoutes(POSTS);
    assert.ok(all['/blog/what-mape-meant/'], 'post route missing.');
    assert.ok(
      all['/blog/forecasting-a-contact-centre/'],
      'a post id carrying a .md extension must not leak the extension into the path.'
    );
    assert.equal(all['/blog/what-mape-meant/'].title, POSTS[0].data.title);
    assert.equal(all['/blog/what-mape-meant/'].eyebrow, 'Writing');
  });

  test('static and project records are untouched by the blog branch', () => {
    const bare = ogRoutes();
    const withPosts = ogRoutes(POSTS);
    for (const [path, rec] of Object.entries(bare)) {
      assert.deepEqual(withPosts[path], rec, `${path} changed when posts were passed in.`);
    }
  });

  test('an empty collection is the same as no argument', () => {
    assert.deepEqual(ogRoutes([]), ogRoutes());
  });
});

describe('ogRoutes is pure', () => {
  test('two calls return deeply equal results', () => {
    assert.deepEqual(ogRoutes(POSTS), ogRoutes(POSTS));
  });

  test('calling it does not mutate staticRoutes or projectRoutes', () => {
    const staticBefore = structuredClone(staticRoutes);
    const projectBefore = structuredClone(projectRoutes);
    ogRoutes(POSTS);
    assert.deepEqual(staticRoutes, staticBefore);
    assert.deepEqual(projectRoutes, projectBefore);
  });
});
