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

import fs from 'node:fs';

import { verifyResvg } from './verify-resvg.mjs';
import { verifyFonts } from './verify-fonts.mjs';

const BLOG_DIR = new URL('../src/content/blog/', import.meta.url);

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

        void command;

        await verifyResvg();
        await verifyFonts();
      },
    },
  };
}
