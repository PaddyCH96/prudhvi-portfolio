# prudhvik.dev

Personal portfolio site for Prudhvi "Paddy" Kadamuthuri — Data Analyst, BI &
Analytics Engineering.

Built with Astro, static output, **zero JavaScript framework shipped to the
browser**. The only client-side JS on the page is the theme toggle and the churn
demo's view switch, both hand-written and a few lines each.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # TypeScript / Astro diagnostics
npm run build      # check + static site → dist/
npm run build:fast # build without the check (use sparingly)
npm run preview    # serve dist/ locally
```

`npm run build` runs `astro check` first, so a type error fails the build rather
than shipping. The project is clean under `astro/tsconfigs/strict`.

## Where the content lives

**Everything is data.** No copy is hard-coded in a component. To change what the
site says, edit a file in `src/data/` — never a `.astro` file.

| File | Holds |
|---|---|
| `src/data/profile.js` | Name, headline, blurb, contact links, hero stats, site/domain config |
| `src/data/projects.js` | All 8 projects — summary, problem/approach/outcome, proof points, stack |
| `src/data/experience.js` | Work history, skills, education, certifications |
| `src/data/churn.js` | The four published churn figures the demo renders |
| `src/data/index.js` | Barrel — the single import surface components use |

Components import **only** from `src/data/index.js`. That way the file split can
change without touching a single component.

### The sourcing rule

> Every number on this site must be true in `Master/*.yaml` (Job Hunt OS) or
> verifiable in the repo it describes.

This is not decoration. The résumé and the site are generated from the same
facts, so they cannot drift apart in front of a hiring manager. If you cannot
point at the source, the claim does not go on the site.

Two corrections were made under this rule during the Phase 0 rebuild — see
`TECHNICAL_SUMMARY.md`.

## Structure

```
src/
  data/
    index.js               barrel — import from here
    profile.js             identity, stats, site config
    projects.js            all 8 projects
    experience.js          work history, skills, education
    churn.js               churn demo figures
  layouts/
    Base.astro             html shell, palette tokens, theme toggle
  components/
    Sections.astro         hero, projects, experience, skills, education, contact
    ChurnExplorer.astro    the interactive demo
  pages/
    index.astro            composes the homepage
    about.astro            the narrative
    projects/
      index.astro          full catalogue with category filtering
      [slug].astro         case study template — one page per project
    blog/
      index.astro          post list (with empty state)
      [...slug].astro      post template
  content/
    blog/*.md|mdx          blog posts
  content.config.ts        blog collection schema
public/
  Prudhvi_Kadamuthuri_Resume.pdf   served by the download button
```

## Adding a project

Append an object to the `projects` array in `src/data/projects.js`. Required
fields — the build will surface a missing one immediately:

```js
{
  slug: 'my-project',           // URL segment for /projects/[slug]
  name: 'My Project',
  tag: 'Analysis · Reporting',  // small uppercase label on the card
  category: 'Analytics',        // 'Analytics' | 'Full-stack' | 'AI'
  featured: false,              // true → shows on the homepage
  status: 'Shipped',
  url: 'https://github.com/…',
  summary: 'One sentence.',
  problem: 'What was broken and why it mattered.',
  approach: 'What you actually did.',
  outcome: 'What changed, with a number in it.',
  points: ['Scannable proof', '…'],
  stack: ['Python', '…'],
}
```

`featured: true` puts it on the homepage. Keep that list to four — the homepage
is a trailer, not the catalogue.

**`url` may be `null`.** When a project has no public repository, set it to
`null` and the page renders a quiet "Source not public" note instead of a button
that 404s. Repo names do not always match local folder names — verify against
the repo's actual git remote (`git remote get-url origin`), not the folder name.

**Link to `/projects/<slug>/` with the trailing slash.** Astro's directory build
format serves the canonical URL with it; omitting it costs a redirect hop.

## The palette

`Base.astro` defines the colour system as CSS custom properties, with three
declarations per token: bare `:root` (light), `prefers-color-scheme: dark`
guarded against an explicit light override, and `[data-theme="dark"]` so the
manual toggle wins in both directions.

The blue/red pair (`--series-1` / `--accent-warm`) is validated for colour-vision
deficiency in both modes. **Do not swap those two without re-checking contrast** —
they carry meaning in the churn demo, not just decoration.

Interactive blue is a **separate token**: `--link` (with `--link-ink` for text
sitting on top of it). This split exists because `--series-1` as *text* on the
light plane only reaches 4.19:1, under the WCAG AA minimum of 4.5:1 — but it
cannot simply be darkened, because it is a data mark whose relationship to
`--accent-warm` is already validated. Links and buttons use `--link`; charts use
`--series-1`. Do not merge them back together.

## The interactive demo

`ChurnExplorer.astro` is a segment comparison built **only from published
findings** of the telecom churn study — the four real rates (26.5% baseline,
54.3% first-6-month cohort, 42.7% month-to-month, 9.0% protective bundle). No
synthetic per-customer data is generated anywhere.

Colour encodes polarity against the baseline (blue at or below, red above). A
table view and direct value labels mean identity is never carried by colour
alone.

## Deploying

Static output, so any host works. Target is **Cloudflare Pages** on
`prudhvik.dev`.

1. Push to GitHub.
2. Cloudflare Pages → Create project → connect the repo.
3. Build command `npm run build`, output directory `dist`.
4. Add `prudhvik.dev` as a custom domain; Cloudflare handles DNS and SSL.

`site` in `astro.config.mjs` is already set to `https://prudhvik.dev`. Serving
from the apex domain means **no `base` path is needed**. If you ever serve from a
subpath instead, add `base: '/<repo>'` there.

## Swapping the résumé

Replace `public/Prudhvi_Kadamuthuri_Resume.pdf`. The file currently there is the
full master résumé (3 pages) — a trimmed 2-page version is better for a portfolio
download.

## Testing

`npm run check` gives type diagnostics. Beyond that there is no test framework,
by design — this is a static content site, and the real failure modes are "the
build broke", "the content didn't render", and "a link is dead". A green build
plus rendered-output assertions cover all three; the reproducible checks are
recorded in `TECHNICAL_SUMMARY.md`.

## Sharing links

Every page carries a canonical URL, Open Graph and Twitter card tags, so a link
pasted into LinkedIn, Slack, iMessage or email previews with a real title and
description. Case studies declare `og:type=article`; the homepage is `website`.

There is no `og:image` yet — previews render as text-only cards. Adding one is a
Phase 3/4 item.

## Case studies

`src/pages/projects/[slug].astro` generates one page per project from
`src/data/projects.js` — 8 projects, 8 pages, one template. Add a project to the
data file and its page appears on the next build.

Each page follows the same spine: **problem → what I did → what changed**, then
detail and stack. The outcome paragraph gets a left rule because it carries the
number, and the number is the reason anyone reads a case study.

Every case study links to all seven siblings at the bottom, so nothing is
orphaned before the `/projects` index arrives in Phase 2.

## Writing a blog post

Drop a `.md` or `.mdx` file in `src/content/blog/`. The filename becomes the
URL. Frontmatter is validated by `src/content.config.ts` — a missing field fails
the build rather than rendering a broken page.

```yaml
---
title: "Your title"
description: "One or two sentences. Also used as the meta and OG description."
date: 2026-08-24
tags: ["forecasting", "sql"]
draft: true     # drafts are visible in `npm run dev`, excluded from `npm run build`
---
```

Write, preview with `npm run dev`, then set `draft: false` to publish. The
`/blog` index shows a proper empty state while nothing is published, so the
route is never broken.

## Filtering on /projects

Category filtering is **progressive enhancement**. The HTML ships all eight
projects visible and the filter bar carries `hidden`; the script removes
`hidden` on load. Without JavaScript the page is a complete, working catalogue
rather than a set of dead buttons.

## Roadmap

Phases 0 (data layer), 1 (case studies) and 2 (routes) are complete.

- **Phase 3** — design pass, `og:image`, favicon, richer responsive work
- **Phase 4** — sitemap, RSS, Cloudflare Pages, domain, analytics
