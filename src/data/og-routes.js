// ─────────────────────────────────────────────────────────────
// Share-card route records. One record per route that ships an og:image,
// and the single source of every og:image:alt string on the site.
//
// Contract:
//   path     route pathname WITH trailing slash — the key pages look up by
//   slug     filename stem for public/og/<slug>.<hash>.png
//   eyebrow  uppercase label line on the card
//   title    card headline text
//   slot     the resolved headline slot — never empty (D-08)
//   unit     small unit under a numeric slot, or null
//   alt      og:image:alt, non-empty and <= OG_ALT_MAX chars
//
// This module imports nothing from `astro:content`. getCollection is async and
// only resolvable inside the Astro module graph, but build/card.mjs runs as
// plain Node and has to import these records too. So the static and project
// records are synchronous derivations, and blog records come from
// `ogRoutes(posts)` — a pure function taking the already-fetched collection as
// an argument, the same shape as projectBySlug(slug).
//
// Blog records are DERIVED, never enumerated. src/content/blog/hello.md is one
// `draft: false` away from publishing a route; an enumerated list would turn
// publishing a post into a build failure that names none of the actual cause.
//
// SOURCING RULE: every claim here must be true in Master/*.yaml (Job Hunt OS)
// or verifiable in the project repo it describes. No count is typed — every
// one derives from projects.length.
// ─────────────────────────────────────────────────────────────

import { projects, categories, projectCount, projectCountWord } from './projects.js';

/**
 * @typedef {object} OgRoute
 * @property {string} path       route pathname WITH trailing slash, e.g. '/projects/ncf-recsys/'
 * @property {string} slug       filename stem for public/og/<slug>.<hash>.png; matches /^[a-z0-9-]+$/
 * @property {string} eyebrow    uppercase label line
 * @property {string} title      card headline text
 * @property {string} slot       resolved headline slot text, never empty
 * @property {string|null} unit  small unit under a numeric slot, or null
 * @property {string} alt        og:image:alt, non-empty, <= OG_ALT_MAX chars
 */

/**
 * @typedef {object} BlogEntryData
 * @property {string} title
 * @property {string} description
 * @property {Date} date
 * @property {string[]} tags
 * @property {boolean} draft
 *
 * @typedef {object} BlogEntry
 * @property {string} id
 * @property {BlogEntryData} data
 */

/**
 * og:image:alt budget. Twitter truncates past ~420, but a share-card alt that
 * runs long is a description of an image nobody is reading aloud — 160 keeps it
 * to one useful sentence.
 * @type {number}
 */
export const OG_ALT_MAX = 160;

/** Slugs are composed into public/og/<slug>.<hash>.png write paths. */
const SAFE_SLUG = /^[a-z0-9-]+$/;

/**
 * Build the alt string from the record itself, so no page ever hand-authors
 * one and Base.astro never hard-codes one (C-5, Prohibition 15). If the result
 * would overrun the budget, the slot is trimmed at a word boundary rather than
 * mid-word — the title and eyebrow carry the meaning and are never cut.
 * @param {string} title
 * @param {string} eyebrow
 * @param {string} slot
 * @returns {string}
 */
function altFor(title, eyebrow, slot) {
  const full = `Share card: ${title}, ${eyebrow} — ${slot}.`;
  if (full.length <= OG_ALT_MAX) return full;

  const overrun = full.length - OG_ALT_MAX;
  let trimmed = slot.slice(0, Math.max(0, slot.length - overrun));
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > 0) trimmed = trimmed.slice(0, lastSpace);
  trimmed = trimmed.trim();

  const short = trimmed
    ? `Share card: ${title}, ${eyebrow} — ${trimmed}.`
    : `Share card: ${title}, ${eyebrow}.`;

  return short.length <= OG_ALT_MAX ? short : short.slice(0, OG_ALT_MAX - 1).trim() + '.';
}

/**
 * Assemble one record and assert it before it escapes this module. A bad slug
 * here becomes a filesystem write path in plan 03-04, so it is rejected at the
 * point of construction rather than at the point of use (ASVS V12).
 * @param {{path: string, slug: string, eyebrow: string, title: string, slot: string, unit?: string|null}} input
 * @returns {OgRoute}
 */
function record({ path, slug, eyebrow, title, slot, unit = null }) {
  if (!SAFE_SLUG.test(slug)) {
    throw new Error(
      `og-routes: slug '${slug}' for ${path} is not [a-z0-9-]. That string is ` +
        `composed into a public/og/<slug>.png write path — fix the slug, do not ` +
        `loosen the pattern.`
    );
  }
  if (!path.endsWith('/')) {
    throw new Error(`og-routes: path '${path}' has no trailing slash (C-6).`);
  }
  for (const [key, value] of /** @type {[string, string][]} */ ([
    ['eyebrow', eyebrow],
    ['title', title],
    ['slot', slot],
  ])) {
    if (!value || !value.trim()) {
      throw new Error(
        `og-routes: ${key} is empty for ${path}. The headline slot can never ` +
          `render empty — resolve it to the category · status chip instead (D-08).`
      );
    }
  }
  return { path, slug, eyebrow, title, slot, unit, alt: altFor(title, eyebrow, slot) };
}

/**
 * The four routes that are not a project or a post. Every count in a title or
 * slot derives from the catalogue.
 * @type {OgRoute[]}
 */
export const staticRoutes = [
  record({
    path: '/',
    slug: 'home',
    eyebrow: 'Data Analyst · BI & Analytics Engineering',
    title: 'Prudhvi “Paddy” Kadamuthuri',
    slot: `5 yrs · ${projectCount} projects`,
  }),
  record({
    path: '/projects/',
    slug: 'projects',
    eyebrow: 'Selected work',
    title: `${projectCountWord} projects`,
    slot: categories.join(' · '),
  }),
  record({
    path: '/about/',
    slug: 'about',
    eyebrow: 'About',
    title: 'Prudhvi Kadamuthuri',
    slot: 'Data Analyst · 5 yrs',
  }),
  record({
    path: '/blog/',
    slug: 'blog',
    eyebrow: 'Writing',
    title: 'Notes on analytics',
    slot: 'Writing · In progress',
  }),
];

/**
 * One record per project. Headline slot resolution follows the D-08 order:
 * an authored cardStat wins, and a null cardStat — a decision, not an
 * oversight — resolves to the bare status. There is no third branch, and
 * nothing is re-derived from `outcome` (D-23 deleted that regex).
 *
 * The fallback is the status ALONE, not `category · status`: the eyebrow
 * already carries the category, so the pair rendered it twice on the same
 * card. The shorter string also clears the 1056px inner box at full 104px,
 * so these cards no longer step down.
 * @type {OgRoute[]}
 */
export const projectRoutes = projects.map((project) =>
  record({
    path: `/projects/${project.slug}/`,
    slug: project.slug,
    eyebrow: project.category,
    title: project.name,
    slot: project.cardStat ? project.cardStat.value : project.status,
    unit: project.cardStat ? project.cardStat.unit : null,
  })
);

/**
 * Every share-card record, keyed by pathname.
 *
 * `posts` is the blog collection the caller already fetched — pass the same
 * draft-filtered array /blog/ renders from. Called with no argument (or an
 * empty array) it returns the static and project records only, which is what
 * plain-Node consumers such as build/card.mjs get.
 *
 * @param {BlogEntry[]} [posts]
 * @returns {Record<string, OgRoute>}
 */
export function ogRoutes(posts = []) {
  const blogRoutes = posts.map((post) => {
    const slug = post.id.replace(/\.[^.]+$/, '');
    return record({
      path: `/blog/${slug}/`,
      slug,
      eyebrow: 'Writing',
      title: post.data.title,
      slot: String(new Date(post.data.date).getFullYear()),
    });
  });

  /** @type {Record<string, OgRoute>} */
  const byPath = {};
  for (const route of [...staticRoutes, ...projectRoutes, ...blogRoutes]) {
    byPath[route.path] = route;
  }
  return byPath;
}
