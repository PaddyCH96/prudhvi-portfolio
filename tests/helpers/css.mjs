// ─────────────────────────────────────────────────────────────
// Shared CSS parsing and the declared scope of the DSGN-04 gates.
//
// This is a helper, not a test file: typography.test.mjs and
// spacing.test.mjs both gate the same selector set, and importing one test
// file from the other would run its suite twice.
// ─────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';

/** Rules gated here — the hero surface plan 03-07 rewrites. */
export const GATED = [
  '.hero',
  '.hero-inner',
  '.hero-title',
  '.hero-headline',
  '.hero-blurb',
  '.hero-actions',
  '.hero-cta',
  '.hero-secondary',
  '.see-all',
  '.stats',
  '.stat',
  '.stat-v',
  '.stat-l',
];

/** Not gated here, each with the reason it is out of scope. */
export const EXEMPT = [
  [
    'src/pages/projects/[slug].astro',
    'owned by plan 03-08 and its tests/gates/casestudy.test.mjs; 03-08 runs in this same wave and is the only plan that edits that file. Gating it here would make this file depend on a sibling plan landing first. Do not add it back.',
  ],
  ['.card-links', 'projects-row link pair in Sections.astro — not edited by this phase; still carries 14px / 500'],
  ['.grid2', 'projects grid in Sections.astro — not edited by this phase'],
  ['.job', 'experience row in Sections.astro — not edited by this phase'],
  ['.job-meta', 'experience metadata column — not edited by this phase'],
  ['.skillrow', 'skills row in Sections.astro — not edited by this phase'],
  ['.skillgroup', 'skills group label — not edited by this phase; still carries 13.5px / 500'],
  [
    'src/layouts/Base.astro is:global',
    'plan 03-06 adds tokens and head markup to it but does not retypeset it; it still carries 12.5 / 13.5 / 14.5 / 15px and a font-weight: 500',
  ],
  ['src/pages/projects/index.astro', 'untouched by this phase'],
  ['src/pages/blog/index.astro', 'untouched by this phase'],
  ['src/pages/blog/[...slug].astro', 'untouched by this phase'],
  ['src/pages/about.astro', 'untouched by this phase'],
  ['src/components/ChurnExplorer.astro', 'untouched by this phase'],
];

export const SOURCE = 'src/components/Sections.astro';


/**
 * The scoped <style> block with comment lines stripped. A comment naming a
 * prohibited value must not trip the rule it documents.
 * @param {string} path
 * @returns {string}
 */
export function stylesheetOf(path) {
  const src = readFileSync(path, 'utf8');
  const start = src.indexOf('<style>');
  const body =
    start === -1 ? src : src.slice(start + '<style>'.length, src.indexOf('</style>', start));
  return body
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith('/*') && !t.startsWith('*') && !t.startsWith('//') && !t.startsWith('─');
    })
    .join('\n');
}

/**
 * Parse a stylesheet into { selector, body } rules. At-rule preludes
 * (@media, @supports) are unwrapped so the rules nested inside them are still
 * gated; @keyframes blocks are dropped, since their stops are not rules.
 * @param {string} css
 * @returns {{selector: string, body: string}[]}
 */
export function rulesOf(css) {
  const flat = css
    .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\}\s*)*\}/g, '')
    .replace(/@(?:media|supports)[^{]*\{/g, '');
  const out = [];
  for (const m of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim().replace(/\s+/g, ' ');
    if (!selector || selector.startsWith('@')) continue;
    out.push({ selector, body: m[2] });
  }
  return out;
}

/**
 * True when a rule's selector list touches any gated selector.
 * @param {string} selector
 * @returns {boolean}
 */
export function isGated(selector) {
  return GATED.some((g) =>
    new RegExp(`(^|[\\s,>+~])${g.replace('.', '\\.')}(?![\\w-])`).test(selector)
  );
}
