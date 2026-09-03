// ─────────────────────────────────────────────────────────────
// Gate: the share-card tags as they actually ship, read from dist/.
//
// The data-level complement lives in tests/gates/ogroutes.test.mjs, which
// asserts the route records before anything renders from them and reads
// nothing under dist/. This file is the other half: the records are correct,
// but did the built HTML carry them, and does the file each page points at
// actually exist? Neither half implies the other.
//
// THE RULE THAT GOVERNS EVERY ASSERTION HERE: no expectation is ever pinned to
// a literal page count. Completeness is derived from the built route list.
// src/content/blog/hello.md is one `draft: false` away from adding a page, and
// an assertion of "9" would turn publishing a post into a build failure naming
// none of the actual cause (03-VALIDATION.md § Open Risk).
// ─────────────────────────────────────────────────────────────

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, globSync } from 'node:fs';

import { OG_ALT_MAX } from '../../src/data/og-routes.js';
// Derived, not literal (the domain changed once already: prudhvik.dev →
// prudhvi.dev) — this asserts the built site against whatever site.url
// actually is, rather than a second hardcoded guess at it.
import { site } from '../../src/data/profile.js';

const DIST = new URL('../../dist/', import.meta.url);
const SITE = site.url;

/** Every built page. The single source of every expectation in this file. */
const PAGES = globSync('**/*.html', { cwd: DIST }).sort();

/** Read one `<meta>` content value by attribute name. */
function meta(html, attr, name) {
  const match = html.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`));
  return match ? match[1] : null;
}

/** Count how many times a meta name/property appears. */
function metaCount(html, attr, name) {
  return (html.match(new RegExp(`<meta[^>]*${attr}="${name}"`, 'g')) || []).length;
}

const HTML = new Map();

before(() => {
  assert.ok(
    PAGES.length > 0,
    'no HTML found under dist/. These gates assert against built output — run ' +
      '`npm run build` before `npm run test:gates`.'
  );
  for (const page of PAGES) HTML.set(page, readFileSync(new URL(page, DIST), 'utf8'));
});

describe('every built page carries a resolvable share card', () => {
  for (const page of PAGES) {
    test(`${page}`, () => {
      const html = HTML.get(page);

      assert.equal(
        metaCount(html, 'property', 'og:image'),
        1,
        `${page} declares og:image ${metaCount(html, 'property', 'og:image')} times. ` +
          `Crawlers pick one and it is not always the one you meant.`
      );

      const image = meta(html, 'property', 'og:image');
      assert.ok(
        image && image.startsWith('https://'),
        `og:image on ${page} is '${image}', not an absolute URL. A relative ` +
          `og:image gives most crawlers a text-only preview — the exact failure ` +
          `the share cards exist to prevent.`
      );

      const local = image.replace(SITE, '');
      assert.ok(
        existsSync(new URL(`.${local}`, DIST)),
        `${page} points at ${local}, which does not exist in dist/. The page ` +
          `advertises a card that 404s.`
      );

      assert.equal(meta(html, 'property', 'og:image:width'), '1200');
      assert.equal(meta(html, 'property', 'og:image:height'), '630');
    });
  }
});

describe('every card has a text equivalent on both tag families', () => {
  for (const page of PAGES) {
    test(`${page}`, () => {
      const html = HTML.get(page);
      const ogAlt = meta(html, 'property', 'og:image:alt');
      const twitterAlt = meta(html, 'name', 'twitter:image:alt');

      for (const [label, value] of [
        ['og:image:alt', ogAlt],
        ['twitter:image:alt', twitterAlt],
      ]) {
        assert.ok(
          value && value.trim(),
          `${label} missing or empty for ${page}. Every share card needs a text ` +
            `equivalent; add it to the route record in the card data module, not ` +
            `to the template.`
        );
        assert.ok(
          value.length <= OG_ALT_MAX,
          `${label} on ${page} is ${value.length} chars, over the ${OG_ALT_MAX} budget.`
        );
      }

      assert.equal(
        ogAlt,
        twitterAlt,
        `${page} describes the same image two different ways. Both alts come from ` +
          `one route record — if they differ, one of them was hand-authored.`
      );
    });
  }
});

describe('the card previews large, not as a small square (D-11)', () => {
  for (const page of PAGES) {
    test(`${page}`, () => {
      const html = HTML.get(page);
      assert.equal(
        meta(html, 'name', 'twitter:card'),
        'summary_large_image',
        `twitter:card on ${page} is not summary_large_image. A 1200x630 card served ` +
          `as 'summary' is cropped to a small square.`
      );
      assert.equal(
        meta(html, 'name', 'twitter:image'),
        meta(html, 'property', 'og:image'),
        `${page} advertises different images to Twitter and to everyone else.`
      );
    });
  }
});

describe('card coverage is complete in both directions', () => {
  test('no two pages share a card', () => {
    const images = PAGES.map((page) => meta(HTML.get(page), 'property', 'og:image'));
    const dupes = images.filter((img, i) => images.indexOf(img) !== i);
    assert.deepEqual(
      [...new Set(dupes)],
      [],
      'two routes ship the same card. Each page has its own record, so this means ' +
        'the layout resolved the wrong one — not that a card is missing.'
    );
  });

  test('every card written to dist/og/ is referenced by a page', () => {
    const referenced = new Set(
      PAGES.map((page) => meta(HTML.get(page), 'property', 'og:image').replace(SITE, ''))
    );
    const written = readdirSync(new URL('og/', DIST)).filter((n) => n.endsWith('.png'));

    for (const file of written) {
      assert.ok(
        referenced.has(`/og/${file}`),
        `dist/og/${file} is referenced by no page. Cards are content-hashed, so an ` +
          `orphan is a stale write the sweep should have removed — the deployed ` +
          `bundle is carrying a card from a previous state of the data.`
      );
    }
  });

  test('the card set is exactly as large as the page set', () => {
    // Derived from PAGES, never from a literal. Publishing a post adds a page
    // and a card together, and this stays true.
    const written = readdirSync(new URL('og/', DIST)).filter((n) => n.endsWith('.png'));
    assert.equal(
      written.length,
      PAGES.length,
      'the number of cards and the number of pages have diverged. Do not reconcile ' +
        'this by editing a number — find the page with no card or the card with no page.'
    );
  });
});
