// ─────────────────────────────────────────────────────────────
// Gate: the internal link graph, asserted against dist/ (C-12, C-6).
//
// DSGN-03's wording is "re-verified, not assumed". Plan 03-08 drops each case
// study's footer from every sibling to three related projects, which is
// exactly the change that can take away a page's last inbound link. So this
// reads BUILT output, not src/ and not the data file: what matters is the
// graph a visitor actually receives.
//
// Coverage is satisfied by /projects/ linking every case study (D-20).
// Sibling-to-sibling full coverage is deliberately NOT asserted — asserting
// it would contradict D-19's three-card selection.
//
// NO COUNT LITERALS. Every expectation derives from `projects` or from the
// globbed page list, so publishing a blog post does not turn this gate red.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';

import { projects } from '../../src/data/projects.js';

const DIST = 'dist';

/** Hrefs that name a file rather than a page, so the trailing slash does not apply. */
const ASSET_EXTENSIONS = [
  '.pdf', '.png', '.svg', '.ico', '.webmanifest', '.xml',
  '.jpg', '.webp', '.txt', '.json', '.css', '.js',
];

/**
 * Every file under dist/, recursively.
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = `${dir}/${f}`;
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

assert.ok(
  existsSync(DIST),
  'dist/ is missing. This gate asserts against built output — run `npm run build` first.'
);

const pages = walk(DIST).filter((f) => f.endsWith('.html'));

assert.ok(pages.length > 0, 'dist/ contains no HTML. The build produced nothing to check.');

/** @param {string} href */
const isExternal = (href) => /^(?:https?:|mailto:|tel:|data:)/i.test(href);
/** @param {string} href */
const isFragment = (href) => href.startsWith('#');
/** @param {string} href */
const isAsset = (href) => ASSET_EXTENSIONS.some((e) => href.endsWith(e));

/**
 * Every href on a page, in document order.
 * @param {string} html
 * @returns {string[]}
 */
function hrefsOf(html) {
  return [...html.matchAll(/\bhref\s*=\s*["']([^"']*)["']/g)].map((m) => m[1].trim());
}

/**
 * The site-relative URL a built file is served at, in directory form.
 * dist/projects/x/index.html → /projects/x/
 * @param {string} file
 * @returns {string}
 */
function urlOf(file) {
  return file.slice(DIST.length).replace(/index\.html$/, '');
}

/** The path part of an href, with any query string or fragment removed. */
const pathOf = (href) => href.split(/[?#]/)[0];

/** [{ file, url, html, hrefs }] for every built page. */
const graph = pages.map((file) => {
  const html = readFileSync(file, 'utf8');
  return { file, url: urlOf(file), html, hrefs: hrefsOf(html) };
});

/** Every case study's served URL, derived from the catalogue — never a literal. */
const caseStudyUrls = projects.map((p) => `/projects/${p.slug}/`);

describe('link graph — resolution (C-12)', () => {
  test('every internal href resolves to a real file in dist/', () => {
    for (const page of graph) {
      for (const href of page.hrefs) {
        if (!href || isExternal(href) || isFragment(href)) continue;
        assert.ok(
          href.startsWith('/'),
          `${page.file} links to "${href}", which is neither absolute-internal nor external. ` +
            `Internal links on this site are root-relative.`
        );
        const path = pathOf(href);
        const target = path.endsWith('/') ? `${DIST}${path}index.html` : `${DIST}${path}`;
        assert.ok(
          existsSync(target),
          `${page.file} links to "${href}", which resolves to no file in dist/ ` +
            `(looked for ${target}). That is a 404 shipped to a reader.`
        );
      }
    }
  });
});

describe('link graph — no orphans (C-12 / D-20)', () => {
  test('every case study has at least one inbound internal link', () => {
    for (const url of caseStudyUrls) {
      const slug = url.split('/').filter(Boolean).pop();
      const inbound = graph.filter(
        (page) => page.url !== url && page.hrefs.some((h) => pathOf(h) === url)
      );
      assert.ok(
        inbound.length > 0,
        `Link graph assertion failed: ${slug} has no inbound link. C-12 requires every case ` +
          `study to be reachable. /projects/ must link all ${projects.length}.`
      );
    }
  });

  test('/projects/ links every case study', () => {
    const catalogue = graph.find((p) => p.url === '/projects/');
    assert.ok(
      catalogue,
      'dist/projects/index.html is missing — the catalogue is the coverage guarantee.'
    );
    const linked = new Set(catalogue.hrefs.map(pathOf));
    for (const url of caseStudyUrls) {
      assert.ok(
        linked.has(url),
        `Link graph assertion failed: ${url.split('/').filter(Boolean).pop()} has no inbound ` +
          `link. C-12 requires every case study to be reachable. /projects/ must link all ` +
          `${projects.length}.`
      );
    }
  });
});

describe('link graph — canonical trailing slash (C-6)', () => {
  test('every internal directory-form href ends with /', () => {
    for (const page of graph) {
      for (const href of page.hrefs) {
        if (!href || isExternal(href) || isFragment(href)) continue;
        const path = pathOf(href);
        if (path === '' || isAsset(path)) continue;
        assert.ok(
          path.endsWith('/'),
          `${page.file} links to "${href}" without a trailing slash. Phase 1.1 closed that ` +
            `redirect hop; "${path}/" is the canonical form (C-6).`
        );
      }
    }
  });
});

describe('link graph — fragments resolve', () => {
  test('every same-page #fragment has a matching id in that document', () => {
    for (const page of graph) {
      for (const href of page.hrefs) {
        if (!isFragment(href) || href === '#') continue;
        const id = href.slice(1);
        assert.ok(
          new RegExp(`\\bid\\s*=\\s*["']${id}["']`).test(page.html),
          `${page.file} links to "${href}" but declares no element with id="${id}".`
        );
      }
    }
  });
});
