// ─────────────────────────────────────────────────────────────
// Gate: the architectural promises, asserted against dist/ rather than src/.
//
// Everything here is a claim about what a VISITOR receives, so source is the
// wrong place to look: a font can reach dist/ through an asset pipeline no
// grep of src/ would catch, and a fourth <script> can arrive from a component
// nobody remembers importing.
//
// Four promises:
//   C-11  one <h1> per page
//   C-13  exactly three distinct inline scripts, site-wide
//   C-14  /projects/ is a complete catalogue with JS disabled
//   D-09  exactly one display face reaches a visitor, inside a size budget
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';

import { projects } from '../../src/data/projects.js';

const DIST = 'dist';

/** C-13 is a constraint value, not a derived count. The literal is correct. */
const CLIENT_SCRIPT_BUDGET = 3;

/** Font containers a visitor could be made to download. */
const FONT_EXTENSIONS = ['.ttf', '.woff', '.woff2', '.otf'];

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
  'dist/ is missing. These gates assert against built output — run `npm run build` first.'
);

const allFiles = walk(DIST);
const pages = allFiles.filter((f) => f.endsWith('.html'));
const stylesheets = allFiles.filter((f) => f.endsWith('.css'));

/**
 * Inline script bodies on a page. External `src=` scripts are counted as
 * their own entries by URL, since they are also runtime the visitor executes.
 * @param {string} html
 * @returns {string[]}
 */
function scriptsOf(html) {
  const out = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/.exec(m[1]);
    out.push(src ? `src:${src[1]}` : m[2].trim());
  }
  return out;
}

describe('C-11 — one h1 per built page', () => {
  for (const page of pages) {
    test(`${page} has exactly one <h1>`, () => {
      const count = (readFileSync(page, 'utf8').match(/<h1\b/g) ?? []).length;
      assert.equal(
        count,
        1,
        `${page} renders ${count} <h1> elements. Every page gets exactly one — it is the ` +
          `document's accessible title, not a heading size.`
      );
    });
  }
});

describe('C-13 — the client-script inventory stays at three', () => {
  const distinct = new Set();
  const byScript = new Map();
  for (const page of pages) {
    for (const body of scriptsOf(readFileSync(page, 'utf8'))) {
      distinct.add(body);
      if (!byScript.has(body)) byScript.set(body, []);
      byScript.get(body).push(page);
    }
  }

  test(`exactly ${CLIENT_SCRIPT_BUDGET} distinct scripts ship site-wide`, () => {
    const inventory = [...distinct]
      .map((s) => `  · ${s.slice(0, 60).replace(/\s+/g, ' ')}…`)
      .join('\n');
    assert.equal(
      distinct.size,
      CLIENT_SCRIPT_BUDGET,
      `the site ships ${distinct.size} distinct client scripts; the budget is ` +
        `${CLIENT_SCRIPT_BUDGET} — the theme toggle, the churn view switch and the /projects ` +
        `category filter. This is an architectural identity, not a performance target: ` +
        `interaction here is CSS and server-rendered HTML.\nInventory:\n${inventory}`
    );
  });

  test('the hero ships no script of its own', () => {
    const hero = readFileSync('src/components/Sections.astro', 'utf8');
    assert.equal(
      /<script/i.test(hero),
      false,
      'Sections.astro contains a <script>. The hero drift is CSS @keyframes; a runtime here ' +
        'would take the inventory to four.'
    );
  });
});

describe('Prohibition 11 — no 3D runtime', () => {
  for (const page of pages) {
    test(`${page} references no WebGL, canvas or 3D runtime`, () => {
      const html = readFileSync(page, 'utf8');
      for (const needle of [/webgl/i, /<canvas\b/i, /three\.min\.js/i, /THREE\./]) {
        assert.equal(
          needle.test(html),
          false,
          `${page} matches ${needle}. The "3D feel" is a CSS gradient, veil and drift — ` +
            `not a rendering runtime.`
        );
      }
    });
  }
});

describe('C-14 — /projects/ is a complete catalogue with JS disabled', () => {
  const path = `${DIST}/projects/index.html`;
  const html = readFileSync(path, 'utf8');
  const cards = [...html.matchAll(/<article\b[^>]*class="[^"]*\bitem\b[^"]*"[^>]*>/g)].map(
    (m) => m[0]
  );

  test('every project in the catalogue renders a card', () => {
    assert.equal(
      cards.length,
      projects.length,
      `${path} renders ${cards.length} cards for a catalogue of ${projects.length}. The count ` +
        `is derived from projects.length on purpose — a literal here goes stale the next time ` +
        `a project lands.`
    );
  });

  test('no project card is hidden by default', () => {
    for (const card of cards) {
      assert.equal(
        /\bhidden\b/.test(card),
        false,
        `${path} ships a project card with a hidden attribute. With JS disabled that project ` +
          `is unreachable — the no-JS default must be the complete catalogue.`
      );
    }
  });

  test('the filter bar is hidden by default', () => {
    const filters = /<div\b[^>]*id="filters"[^>]*>/.exec(html);
    assert.ok(filters, `${path} has no #filters element.`);
    assert.match(
      filters[0],
      /\bhidden\b/,
      `${path} ships the filter bar visible. It must default to hidden and be revealed by ` +
        `its own script — otherwise a no-JS visitor sees buttons that do nothing.`
    );
  });
});

// D-09 was originally "no font reaches a visitor". The redesign revises it to
// "exactly ONE display face reaches a visitor, inside a size budget", because
// the condensed proportion is the single largest carrier of the new visual
// identity and no system stack supplies it reliably (Arial Narrow on macOS and
// Windows, frequently nothing on Linux).
//
// The revision is deliberately narrow. The original decline was costed at
// ~150KB for a full geometric sans family; this is 8.6KB of latin-only display
// face with font-display: swap, so nothing blocks first paint and body text
// still comes from the system stack. Manrope remains BUILD-ONLY — it is the
// satori card renderer's typeface and must never become a download.
//
// The gate is narrowed rather than deleted: without a ceiling, "one font" is
// how a family arrives one weight at a time.
const DISPLAY_FACE = 'bebas-neue-v16-latin-regular.woff2';
const FONT_BUDGET_BYTES = 12 * 1024;

describe('D-09 — exactly one display face reaches a visitor', () => {
  test('dist/ ships the display face and nothing else', () => {
    const fonts = allFiles.filter((f) => FONT_EXTENSIONS.some((e) => f.toLowerCase().endsWith(e)));
    const unexpected = fonts.filter((f) => !f.endsWith(DISPLAY_FACE));
    assert.deepEqual(
      unexpected,
      [],
      `dist/ ships font file(s) that are not the one permitted display face: ` +
        `${unexpected.join(', ')}. D-09 allows ${DISPLAY_FACE} alone. Manrope is a BUILD-ONLY ` +
        `asset for the share-card renderer and the monogram export; a stylesheet import would ` +
        `ship ~70KB silently.`
    );
    assert.equal(
      fonts.length,
      1,
      `dist/ ships ${fonts.length} font files, expected exactly 1. Shipping the face in a ` +
        `second container (a .ttf next to the .woff2) doubles the download for no gain.`
    );
  });

  test('the display face stays inside its size budget', () => {
    const face = allFiles.find((f) => f.endsWith(DISPLAY_FACE));
    assert.ok(face, `${DISPLAY_FACE} is not in dist/. D-09 now expects it to be served.`);
    const bytes = statSync(face).size;
    assert.ok(
      bytes <= FONT_BUDGET_BYTES,
      `${DISPLAY_FACE} is ${bytes} bytes, over the ${FONT_BUDGET_BYTES}-byte budget. D-09 was ` +
        `revised on the arithmetic that one latin-only display face costs ~8.6KB against the ` +
        `~150KB that got a full family declined. A subset that has grown past this budget means ` +
        `that arithmetic no longer holds — re-make the decision rather than raising the number.`
    );
  });

  test('exactly one @font-face is declared, and it is the display face', () => {
    /** @type {string[]} */
    const declarations = [];
    const collect = (css, where) => {
      for (const m of css.matchAll(/@font-face\s*\{([\s\S]*?)\}/gi)) {
        declarations.push(`${where}: ${(/font-family\s*:\s*([^;]+);/i.exec(m[1]) ?? [, '?'])[1].trim()}`);
      }
    };
    for (const css of stylesheets) collect(readFileSync(css, 'utf8'), css);
    for (const page of pages) {
      const html = readFileSync(page, 'utf8');
      for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) collect(m[1], page);
    }

    // Astro inlines the same stylesheet into every page, so one authored rule
    // legitimately appears many times. What must hold is that they are all the
    // SAME face — a second family is a second download.
    const families = [...new Set(declarations.map((d) => d.split(': ')[1].replace(/["']/g, '')))];
    assert.deepEqual(
      families,
      ['Bebas Neue'],
      `@font-face declares ${families.length} distinct families: ${families.join(', ')}. D-09 ` +
        `permits exactly one, "Bebas Neue". Each additional family is another visitor download; ` +
        `body text must keep coming from the system stack.`
    );
  });

  test('the @font-face does not block first paint', () => {
    const withSwap = stylesheets
      .map((css) => readFileSync(css, 'utf8'))
      .concat(
        pages.flatMap((p) =>
          [...readFileSync(p, 'utf8').matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1])
        )
      )
      .filter((css) => /@font-face/i.test(css));
    for (const css of withSwap) {
      for (const m of css.matchAll(/@font-face\s*\{([\s\S]*?)\}/gi)) {
        assert.match(
          m[1],
          /font-display\s*:\s*swap/i,
          `An @font-face omits font-display: swap. Without it the display face blocks text ` +
            `rendering while it downloads, which is the cost D-09 was written to avoid.`
        );
      }
    }
  });
});
