// ─────────────────────────────────────────────────────────────
// The asset pipeline: a local Astro integration that runs every build gate and
// every generated-asset step inside `astro build` itself.
//
// Why an integration and not an npm `prebuild` script: npm's lifecycle attaches
// `prebuild` to `build` ONLY, so `npm run build:fast` (`astro build`, no
// `astro check`) would skip the gates entirely — the exact bypass the UI-SPEC
// forbids by name (Prohibition 16). An integration hook fires inside
// `astro build` no matter which npm script invoked it.
//
// Why `astro:config:setup` and not `astro:build:start`: it is the only hook that
// runs for BOTH `dev` and `build`. The share cards (D-05) and the icons (D-14)
// should be right in the dev server too, not only in `dist/`.
//
// Nothing here is wrapped in a catch. An uncaught throw inside the hook aborts
// the build with a non-zero exit, and that IS D-10's enforcement — swallowing it
// and logging would reproduce the precise failure mode D-10 exists to prevent.
// ─────────────────────────────────────────────────────────────

import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { verifyResvg } from './verify-resvg.mjs';
import { verifyFonts } from './verify-fonts.mjs';
import { fitSlot, overflowReason, renderCard, RENDERER_VERSION } from './card.mjs';
import { generateIcons, ICON_FILES } from './icons.mjs';
import { ogRoutes } from '../src/data/og-routes.js';

const BLOG_DIR = new URL('../src/content/blog/', import.meta.url);
const OG_DIR = new URL('../public/og/', import.meta.url);
const PUBLIC_DIR = new URL('../public/', import.meta.url);
const MARK_SVG = new URL('../src/assets/icon/mark.svg', import.meta.url);
const GENERATED_DIR = new URL('../src/generated/', import.meta.url);
const MANIFEST = new URL('og-manifest.json', GENERATED_DIR);

/** Slugs are composed into filesystem write paths (ASVS V12, T-03-15). */
const SAFE_SLUG = /^[a-z0-9-]+$/;

/**
 * Skip-if-unchanged cache, keyed on the RENDER INPUTS.
 *
 * It cannot be keyed on the output hash — that is sha256 of the rendered PNG
 * and is unknowable before rendering. Nor on "a file for this slug already
 * exists": that would silently preserve a stale card after a `cardStat` edit,
 * which is exactly what D-10 and D-12 exist to prevent. Keying on the inputs
 * means a changed record re-renders, produces a new output hash, gets a new
 * filename, and the stale sweep deletes the old file.
 *
 * Module-scoped so it survives dev-server config reloads (RESEARCH Pitfall 6).
 * A cold start renders everything.
 *
 * @type {Map<string, {file: string, publicPath: string}>}
 */
const renderCache = new Map();

/**
 * The UI-SPEC § Copywriting "Error state — card render" text, verbatim.
 * @param {string} route
 * @param {string} reason
 * @returns {never}
 */
function failCard(route, reason) {
  throw new Error(
    `og:image generation failed for ${route}: ${reason}. A silently broken share ` +
      `card is invisible to you and visible to every recipient. Fix the renderer ` +
      `or the source data — do not bypass with build:fast.`
  );
}

/**
 * Read the blog collection as plain Node.
 *
 * The integration runs during Astro's config load, outside the Astro module
 * graph, so `getCollection('astro:content')` is not resolvable here. This is a
 * deliberately narrow substitute: three scalar frontmatter fields, no YAML
 * dependency. It feeds the `posts` argument of `ogRoutes(posts)`.
 *
 * The draft filter reproduces `src/pages/blog/index.astro:7` and
 * `src/pages/blog/[...slug].astro:6` — `import.meta.env.DEV || !data.draft`.
 * Callers pass `includeDrafts: command === 'dev'` so the card set always matches
 * the route set the running mode actually renders.
 *
 * @param {{includeDrafts?: boolean}} [options]
 * @returns {{id: string, data: {title: string, date: Date, draft: boolean}}[]}
 */
export function readBlogEntries({ includeDrafts = false } = {}) {
  const dir = fs.existsSync(BLOG_DIR) ? fs.readdirSync(BLOG_DIR) : [];
  const files = dir.filter((name) => name.endsWith('.md') || name.endsWith('.mdx')).sort();

  const posts = files.map((name) => {
    const file = new URL(name, BLOG_DIR);
    const raw = fs.readFileSync(file, 'utf8');
    return { id: name.replace(/\.[^.]+$/, ''), data: parseFrontmatter(raw, name) };
  });

  return includeDrafts ? posts : posts.filter((post) => !post.data.draft);
}

/**
 * Parse the YAML block between the first two `---` fences for the three fields
 * a share-card record needs. Values may be bare, single- or double-quoted.
 * A missing required field throws and names the file — a post that cannot be
 * carded fails the build rather than rendering a card with a blank headline.
 *
 * @param {string} raw
 * @param {string} name
 * @returns {{title: string, date: Date, draft: boolean}}
 */
function parseFrontmatter(raw, name) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!match) {
    throw new Error(
      `src/content/blog/${name} has no frontmatter block. Every post needs ` +
        `title and date — they become the share-card title and headline slot.`
    );
  }

  /** @type {Record<string, string>} */
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!pair) continue;
    fields[pair[1]] = pair[2].trim().replace(/^["'](.*)["']$/, '$1');
  }

  for (const key of ['title', 'date']) {
    if (!fields[key]) {
      throw new Error(
        `src/content/blog/${name} is missing frontmatter field '${key}'. ` +
          `The share-card record for /blog/${name.replace(/\.[^.]+$/, '')}/ cannot be built without it.`
      );
    }
  }

  const date = new Date(fields.date);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(
      `src/content/blog/${name} has an unparseable date '${fields.date}'. ` +
        `The share-card headline slot is the post's year.`
    );
  }

  return { title: fields.title, date, draft: fields.draft === 'true' };
}

/**
 * Render one share card per route, content-hash each filename, sweep stale
 * cards and write the manifest the layout reads.
 *
 * `includeDrafts` tracks the running mode. Drafts ARE live routes under
 * `astro dev` (`src/pages/blog/[...slug].astro:6` renders them under
 * `import.meta.env.DEV || !data.draft`), so a manifest built from a
 * drafts-excluded list would leave `/blog/hello/` with no card — and plan
 * 03-06's `Base.astro` lookup, which reproduces the same filter, would throw
 * the moment anyone opened it. That turns D-10's build gate into a dev-server
 * crash on a page that is deliberately visible. In `build` and `preview`
 * drafts stay out, so `dist/` is unchanged.
 *
 * @param {{includeDrafts: boolean}} options
 * @returns {Promise<Record<string, string>>}
 */
export async function generateCards({ includeDrafts }) {
  const fonts = await verifyFonts();
  const routes = ogRoutes(readBlogEntries({ includeDrafts }));

  fs.mkdirSync(OG_DIR, { recursive: true });
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  /** @type {Record<string, string>} */
  const manifest = {};
  /** @type {Set<string>} */
  const kept = new Set();

  for (const route of Object.keys(routes).sort()) {
    const record = routes[route];

    // Defence in depth behind the identical assertion in og-routes.js: this
    // string becomes a filesystem write path (T-03-15).
    if (!SAFE_SLUG.test(record.slug)) {
      failCard(route, `slug '${record.slug}' is not [a-z0-9-] and cannot name a file`);
    }

    const key = crypto
      .createHash('sha256')
      .update(JSON.stringify(record))
      .update(RENDERER_VERSION)
      .update(Buffer.concat(fonts.map((font) => font.data)))
      .digest('hex');

    const cached = renderCache.get(key);
    if (cached && fs.existsSync(new URL(cached.file, OG_DIR))) {
      manifest[route] = cached.publicPath;
      kept.add(cached.file);
      continue;
    }

    // Assert the type-setting rule before rendering, so the failure names the
    // route rather than surfacing as a bare renderer error (D-23).
    const fit = await fitSlot(record, fonts);
    if (!fit.ok) failCard(route, overflowReason(record, fit.width));

    const { png, hash } = await renderCard(record, fonts);
    const file = `${record.slug}.${hash}.png`;
    fs.writeFileSync(new URL(file, OG_DIR), png);

    const publicPath = `/og/${file}`;
    manifest[route] = publicPath;
    kept.add(file);
    renderCache.set(key, { file, publicPath });
  }

  // Stale sweep, scoped to public/og/*.png only. A corrected card lands under a
  // new hashed name (D-12); this removes the name it replaced.
  for (const name of fs.readdirSync(OG_DIR)) {
    if (name.endsWith('.png') && !kept.has(name)) fs.rmSync(new URL(name, OG_DIR));
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

/**
 * The integration. `command` is `'dev' | 'build' | 'preview'` and is kept in
 * scope because the generator needs it: drafts ARE live routes under
 * `astro dev`, so they must be carded there and only there.
 *
 * @returns {{name: string, hooks: Record<string, Function>}}
 */
export function assetPipeline() {
  let ran = false;

  return {
    name: 'portfolio:asset-pipeline',
    hooks: {
      'astro:config:setup': async ({ command }) => {
        // Dev-server restarts re-fire this hook on every config reload
        // (RESEARCH Pitfall 6). The gates are cheap; the renders are not.
        if (ran) return;
        ran = true;

        await verifyResvg();
        await verifyFonts();
        await generateCards({ includeDrafts: command === 'dev' });

        // The icons are produced by THIS hook, immediately after the cards and
        // inside the same `ran` guard, on purpose (D-14). The share card and
        // the favicon are one visual identity; generating them in two separate
        // steps is how they quietly drift apart, because only one of the two
        // would re-run after an edit.
        const written = await generateIcons(fileURLToPath(MARK_SVG), fileURLToPath(PUBLIC_DIR));

        // The returned list is the contract the layout's <link> tags rely on.
        // Assert it here rather than trusting the generator, so a set that goes
        // partial fails the build naming the file, not the browser showing a
        // blank page icon.
        for (const name of ICON_FILES) {
          if (!written.includes(name) || !fs.existsSync(new URL(name, PUBLIC_DIR))) {
            throw new Error(
              `icon generation did not produce public/${name}. The browser-chrome ` +
                `asset set must be complete — a missing icon is invisible to you and ` +
                `visible in every visitor's tab. Fix the generator or the mark, do ` +
                `not bypass with build:fast.`
            );
          }
        }
      },
    },
  };
}
