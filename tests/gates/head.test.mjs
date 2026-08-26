// ─────────────────────────────────────────────────────────────
// Gate: browser-chrome assets in the built document head, read from dist/.
//
// tests/gates/icons.test.mjs asserts the generator produced the icon files.
// This file asserts the pages actually REFERENCE them, and that every href
// resolves inside the deployed bundle — a complete icon set nothing links to
// still shows a blank tab.
//
// As in og.test.mjs, no expectation is pinned to a literal page count. The
// built route list is the source of every assertion here.
// ─────────────────────────────────────────────────────────────

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, globSync } from 'node:fs';

const DIST = new URL('../../dist/', import.meta.url);

const PAGES = globSync('**/*.html', { cwd: DIST }).sort();

/**
 * The icon contract, as the generator names the files. Each entry is a link
 * the page must carry and a file the bundle must contain.
 */
const ICON_LINKS = [
  { rel: 'icon', href: '/favicon.svg' },
  { rel: 'icon', href: '/favicon.ico' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  { rel: 'manifest', href: '/site.webmanifest' },
];

/** --plane in each mode. A meta value cannot read a custom property (D-18). */
const THEME_COLORS = [
  { media: '(prefers-color-scheme: light)', value: '#f9f9f7' },
  { media: '(prefers-color-scheme: dark)', value: '#0d0d0d' },
];

const HTML = new Map();

before(() => {
  assert.ok(
    PAGES.length > 0,
    'no HTML found under dist/. These gates assert against built output — run ' +
      '`npm run build` before `npm run test:gates`.'
  );
  for (const page of PAGES) HTML.set(page, readFileSync(new URL(page, DIST), 'utf8'));
});

describe('the placeholder favicon is gone', () => {
  for (const page of PAGES) {
    test(`${page}`, () => {
      const html = HTML.get(page);
      assert.ok(
        !html.includes('data:image/svg+xml'),
        `${page} still carries a data-URI favicon. The generated icon set replaced it.`
      );
      assert.ok(
        !html.includes('\u{1F4CA}'),
        `${page} still contains the placeholder emoji. It was the favicon before the ` +
          `PK monogram; nothing else should be using it.`
      );
    });
  }
});

describe('every page references the full icon set, and every target ships', () => {
  for (const page of PAGES) {
    test(`${page}`, () => {
      const html = HTML.get(page);
      for (const { rel, href } of ICON_LINKS) {
        assert.ok(
          new RegExp(`<link[^>]*rel="${rel}"[^>]*href="${href}"`).test(html) ||
            new RegExp(`<link[^>]*href="${href}"[^>]*rel="${rel}"`).test(html),
          `${page} has no <link rel="${rel}" href="${href}">. A missing icon link is ` +
            `invisible to you and visible in every visitor's tab.`
        );
        assert.ok(
          existsSync(new URL(`.${href}`, DIST)),
          `${page} links ${href}, which is not in dist/. The link resolves to a 404.`
        );
      }
    });
  }
});

describe('mobile browser chrome matches the page in both modes (D-18)', () => {
  for (const page of PAGES) {
    test(`${page}`, () => {
      const html = HTML.get(page);
      const tags = html.match(/<meta[^>]*name="theme-color"[^>]*>/g) || [];
      assert.equal(
        tags.length,
        2,
        `${page} has ${tags.length} theme-color tags, expected one per colour scheme. ` +
          `A single unqualified tag paints the chrome the wrong colour in one mode.`
      );

      for (const { media, value } of THEME_COLORS) {
        const match = tags.find((tag) => tag.includes(`media="${media}"`));
        assert.ok(match, `${page} has no theme-color for ${media}.`);
        assert.ok(
          match.includes(`content="${value}"`),
          `theme-color for ${media} on ${page} is not ${value}. It mirrors --plane in ` +
            `that mode — if --plane moved, move this with it.`
        );
      }
    });
  }
});

describe('the canonical URL survived (Phase 1.1 regression guard)', () => {
  for (const page of PAGES) {
    test(`${page}`, () => {
      const html = HTML.get(page);
      const match = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
      assert.ok(match, `${page} lost its canonical link.`);
      assert.ok(
        match[1].startsWith('https://'),
        `canonical on ${page} is '${match[1]}', not absolute.`
      );
    });
  }
});
