// ─────────────────────────────────────────────────────────────
// DSGN-05: the README must describe the site that exists.
//
// Only two of its claims are mechanically checkable, and both are gated here
// as SETS rather than counts. A hardcoded number is the exact defect this
// file exists to fix — the data-layer table went stale because it said "six"
// and nobody re-counted when a module was added. Asserting the set means the
// next module to land fails this gate by name.
//
// The rest of the prose is reviewed by a human at the phase checkpoint;
// no assertion can judge whether a paragraph is accurate.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const README = readFileSync('README.md', 'utf8');

/**
 * The README with fenced code blocks removed.
 *
 * Prose rules are matched against this, never the raw file: a documented
 * example — a `projects.js` snippet, a shell transcript — must not trip a
 * rule about what the surrounding prose claims.
 */
// Whitespace is collapsed so a rule about a phrase does not depend on where
// the paragraph happened to wrap. "same category\nfirst" is the same claim as
// "same category first", and a reflow must not turn this gate red.
const PROSE = README.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, ' ');

describe('README data-layer table', () => {
  test('lists every module in src/data/, as a set', () => {
    const modules = readdirSync('src/data')
      .filter((f) => f.endsWith('.js'))
      .sort();

    assert.ok(modules.length > 0, 'src/data/ has no .js modules — the glob is wrong');

    const documented = new Set(
      [...README.matchAll(/`src\/data\/([\w.-]+\.js)`/g)].map((m) => m[1])
    );

    const missing = modules.filter((m) => !documented.has(m));
    assert.deepEqual(
      missing,
      [],
      `README data-layer table omits: ${missing.join(', ')}. ` +
        `Add a row for each — the table is the contributor's map of the data layer.`
    );

    const phantom = [...documented].filter((d) => !modules.includes(d));
    assert.deepEqual(
      phantom,
      [],
      `README documents modules that do not exist: ${phantom.join(', ')}`
    );
  });
});

describe('README client-script count', () => {
  test('says three, and no longer says two', () => {
    assert.ok(
      /three client-side scripts/i.test(PROSE),
      'README must state that there are three client-side scripts'
    );
    assert.ok(
      !/two client-side scripts/i.test(PROSE),
      'the pre-Phase-2 "two client-side scripts" claim survives in the README'
    );
  });

  test('names all three', () => {
    for (const [what, pattern] of [
      ['the theme toggle', /theme toggle/i],
      ["the churn demo's view switch", /view switch/i],
      ['the /projects category filter', /category filter/i],
    ]) {
      assert.ok(pattern.test(PROSE), `README does not name ${what}`);
    }
  });
});

describe('README carries no stale counts or superseded framing', () => {
  test('no hardcoded project/page count', () => {
    const m = PROSE.match(/\b(eight|8)\s+(projects|pages)\b/i);
    assert.equal(
      m,
      null,
      `README hardcodes a catalogue count (${m?.[0]}). Describe the catalogue, ` +
        `or use the derived projectCount / projectCountWord — the count changes.`
    );
  });

  test('the seven-sibling footer framing is gone', () => {
    assert.ok(
      !/seven siblings/i.test(PROSE),
      'the pre-Phase-2 "all seven siblings" framing survives in the README'
    );
  });

  test('the related-cards rule is described instead', () => {
    assert.ok(
      /three\*{0,2}\s+related projects/i.test(PROSE),
      'README does not state that a case study footer shows three related projects'
    );
    assert.ok(
      /same category first/i.test(PROSE),
      'README does not state the same-category-first ordering'
    );
    assert.ok(
      /`\/projects\/`/.test(PROSE),
      'README does not mention the /projects/ catalogue link beneath the related row'
    );
  });
});

describe('README documents the build steps this phase added', () => {
  test('names the asset-pipeline integration and both gates', () => {
    for (const [what, pattern] of [
      ['the portfolio:asset-pipeline integration', /portfolio:asset-pipeline/],
      ['build/verify-resvg.mjs', /verify-resvg/],
      ['build/verify-fonts.mjs', /verify-fonts/],
    ]) {
      assert.ok(pattern.test(README), `README build section does not name ${what}`);
    }
  });

  test('names both generation steps', () => {
    assert.ok(/share card/i.test(PROSE), 'README does not document share-card generation');
    assert.ok(
      /og-manifest\.json/.test(README),
      'README does not mention the generated og-manifest.json'
    );
    assert.ok(/site\.webmanifest/.test(README), 'README does not document icon generation');
  });

  test('states the fail-loud behaviour and that build:fast is not a release path', () => {
    assert.ok(
      /fails the build/i.test(PROSE),
      'README does not state that a card/icon/alt/link failure fails the build'
    );
    assert.ok(
      /build:fast/.test(PROSE) && /not a release path/i.test(PROSE),
      'README does not state that build:fast is not a release path'
    );
  });

  test('explains why the three render packages are pinned exactly', () => {
    assert.ok(
      /pinned to exact versions/i.test(PROSE),
      'README does not explain the exact pins on satori / @resvg/resvg-js / png-to-ico'
    );
    for (const pkg of ['satori', '@resvg/resvg-js', 'png-to-ico']) {
      assert.ok(README.includes(pkg), `README does not name ${pkg} in the pinning note`);
    }
  });

  test('states that the generated assets are gitignored', () => {
    assert.ok(
      /gitignored/i.test(PROSE),
      'README does not explain that public/og/, the icons and src/generated/ are gitignored'
    );
  });
});

describe('README documents the visual sweep and its deployment cost', () => {
  test('gives the chromium prerequisite', () => {
    assert.ok(
      /playwright install chromium/.test(README),
      'README does not tell a fresh clone to install chromium before verify:visual'
    );
  });

  test('documents the Cloudflare mitigation', () => {
    assert.ok(
      /PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1/.test(README),
      'README does not document the Cloudflare browser-download mitigation'
    );
    assert.ok(
      /build image\s+\*{0,2}version 3|build image\s+\*{0,2}v3/i.test(PROSE),
      'README does not document the Cloudflare Pages build image version'
    );
  });

  test('states that verify:visual is not part of the build', () => {
    assert.ok(
      /never invoked by `npm run build`/i.test(PROSE),
      'README does not state that verify:visual stays off the release path'
    );
  });
});

describe('the build script really does exclude the sweep', () => {
  test('npm run build does not invoke verify:visual', () => {
    const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));
    assert.ok(scripts.build, 'package.json has no build script');
    assert.ok(
      !/verify:visual/.test(scripts.build),
      'verify:visual leaked into the build script — every deploy would download a browser'
    );
    assert.ok(scripts['verify:visual'], 'package.json has no verify:visual script');
  });
});
