// ─────────────────────────────────────────────────────────────
// Gate: no literal project count survives in a site string.
//
// D-24 cut the catalogue from eight projects to five, and four authored
// strings went wrong the same day — a hero stat, a meta description, a lead
// paragraph and a link label. Substituting "five" for "eight" would have gone
// wrong again on the next catalogue edit, so the fix was derivation.
//
// This file asserts against SOURCE files rather than built HTML, because a
// hardcoded count is an authoring defect: it is wrong the moment it is typed,
// not the moment it is rendered.
//
// Note for plan 03-07: src/components/Sections.astro carries the fourth
// literal ("See all 8 projects"). That file is owned by 03-07 and will add its
// own subtest here.
// ─────────────────────────────────────────────────────────────

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { stats } from '../../src/data/profile.js';
import { about } from '../../src/data/about.js';
import { projectCount } from '../../src/data/projects.js';

const FILES = [
  'src/data/profile.js',
  'src/data/about.js',
  'src/pages/projects/index.astro',
];

/**
 * Strip comment lines before matching. A comment explaining why a literal is
 * forbidden must not itself trip the rule that forbids it.
 * @param {string} path
 * @returns {string}
 */
function codeOf(path) {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
    })
    .join('\n');
}

const COUNT_PROSE = /\b(eight|8)\s+projects?\b/i;
const COUNT_STAT = /value:\s*['"]\d+['"],\s*label:\s*['"]Projects shipped['"]/;

describe('project counts are derived, not literal', () => {
  for (const path of FILES) {
    test(`${path} states no literal project count`, () => {
      const code = codeOf(path);
      assert.equal(
        COUNT_PROSE.test(code),
        false,
        `${path} hardcodes a project count in prose. Interpolate projectCountWord ` +
          `(or projectCount) instead — the catalogue size changes and the sentence must not.`
      );
      assert.equal(
        COUNT_STAT.test(code),
        false,
        `${path} hardcodes the "Projects shipped" stat value. Use String(projectCount).`
      );
    });
  }

  test('the hero stat reads from projects.length', () => {
    assert.equal(stats.length, 4, 'the hero stat row is four cards; that shape is fixed.');
    const shipped = stats.find((s) => s.label === 'Projects shipped');
    assert.ok(shipped, 'the "Projects shipped" stat has gone missing from profile.stats.');
    assert.equal(
      shipped.value,
      String(projectCount),
      'the "Projects shipped" stat does not equal the catalogue size. It must be ' +
        'String(projectCount), never a typed digit.'
    );
  });
});

describe('the about page names no removed project', () => {
  const prose = JSON.stringify(about);

  for (const gone of ['voicecart', 'focusflow', 'resume matcher']) {
    test(`about.js does not name ${gone}`, () => {
      assert.equal(
        new RegExp(gone, 'i').test(prose),
        false,
        `about.js still names "${gone}", which D-24 removed from the site. The ` +
          `sentence must be rewritten against a surviving project, not deleted — it ` +
          `is the only place the about page evidences full-stack range.`
      );
    });
  }

  test('about.js still evidences full-stack range', () => {
    assert.ok(
      /compliance/i.test(prose),
      'about.js has lost its full-stack evidence. The "Why the projects look like ' +
        'engineering" paragraph needs a shipped-or-building full-stack example.'
    );
  });

  test('the engineering paragraph still has three sentences of evidence', () => {
    const section = about.sections.find(
      (s) => s.title === 'Why the projects look like engineering'
    );
    assert.ok(section, 'the "Why the projects look like engineering" section is missing.');
    assert.equal(section.body.length, 3, 'that section is a three-paragraph shape.');
  });
});
