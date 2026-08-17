# prudhvi-portfolio

Personal portfolio site — Astro, static output, no framework runtime shipped to the browser.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site → dist/
npm run preview    # serve dist/ locally
```

## Where the content lives

**`src/data/profile.js` is the single source of truth.** Headline, stats, projects,
experience, skills, education and the churn figures all come from there — edit that
one file and every section updates.

Every number in it is drawn from `Master/*.yaml` in the Job Hunt OS project, so the
site and the résumé can't drift apart. Same rule as the résumé pipeline: don't add a
claim here that isn't true in `Master/`.

## Structure

```
src/
  data/profile.js            all content
  layouts/Base.astro         html shell, palette tokens, theme toggle
  components/
    Sections.astro           hero, projects, experience, skills, education, contact
    ChurnExplorer.astro      the interactive demo
  pages/index.astro          composes the page
public/
  Prudhvi_Kadamuthuri_Resume.pdf   served by the download button
```

## The interactive demo

`ChurnExplorer.astro` is a segment comparison built **only from published findings**
of the telecom churn study — the four real rates (26.5% baseline, 54.3% first-6-month
cohort, 42.7% month-to-month, 9.0% protective bundle). No synthetic per-customer data
is generated anywhere; the chart shows exactly what the analysis found.

Colour encodes polarity against the baseline (blue at or below, red above), and the
blue/red pair is validated for colour-vision deficiency in both light and dark modes.
A table view and direct value labels mean identity is never carried by colour alone.

## Deploying to GitHub Pages

The site builds to plain static files, so any host works.

**Serving from `PaddyCH96.github.io` (root domain):** push `dist/` to that repo, or
point a Pages action at this one. No config change needed — `astro.config.mjs`
already has `site` set.

**Serving from a project repo** (`paddych96.github.io/prudhvi-portfolio`): add the
base path to `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://paddych96.github.io',
  base: '/prudhvi-portfolio',
  output: 'static',
});
```

Note: `PaddyCH96.github.io` currently returns 404, so Pages is either disabled or the
repo is private — check that repo's Settings → Pages before deploying.

## Swapping the résumé

Replace `public/Prudhvi_Kadamuthuri_Resume.pdf`. The file currently there is the
full master résumé (3 pages) — a trimmed 2-page version is probably better for a
portfolio download.
