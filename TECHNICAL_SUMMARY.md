# Technical Summary — Phase 0: Data Layer

**Date:** 2026-08-24 · **Status:** Complete, build green, zero errors

---

## Objective

Restructure the content layer so the site can carry 8 projects, 4 roles and
multiple routes without the data file becoming unmaintainable — and correct the
factual drift found between `profile.js`, `user.md`, and the actual project
repositories.

No visual redesign. No new routes. Foundation only.

---

## What changed

### 1. Split one data file into five

`src/data/profile.js` was a single 116-line file exporting everything. At 8
projects with full case study fields it would have passed 500 lines and become
the file nobody wants to open.

**Before**

```
src/data/profile.js     profile, stats, projects, experience, skills,
                        education, churnSegments   (116 lines)
```

**After**

```
src/data/
  index.js          barrel — re-exports everything (the only import surface)
  profile.js        identity, hero stats, site/domain config
  projects.js       8 projects + featuredProjects + projectBySlug()
  experience.js     4 roles, skills, education, certifications
  churn.js          the four churn figures
```

**Why a barrel file.** Components import from `../data/index.js` and nothing
else. The internal split can be reorganised at any time without touching a
single `.astro` file. This costs one extra file now and saves a find-and-replace
across every component later.

### 2. Projects: 2 → 8, with a case study schema

Each project gained the fields the Phase 1 case study template will consume:

| Field | Purpose |
|---|---|
| `slug` | URL segment for `/projects/[slug]` |
| `category` | `Analytics` \| `Full-stack` \| `AI` — drives filtering |
| `featured` | Controls homepage placement |
| `status` | Shipped / Alpha / In progress — honest signalling |
| `problem` / `approach` / `outcome` | The case study spine |

Two derived exports avoid scattering filter logic through components:
`featuredProjects` and `projectBySlug(slug)`.

Category split: **Analytics 2 · Full-stack 2 · AI 4.**

The homepage now renders `featuredProjects` (4), not all 8 — a homepage is a
trailer, not a catalogue.

### 3. Factual corrections

These are the part that matters most. Three claims were wrong.

**a) Missing role — Zomato.** `profile.js` listed 3 roles; `user.md` has 4. The
missing one was Data Reporting Analyst at Zomato (Aug 2018 – Jul 2019) — your
only consumer-tech experience and **your only A/B testing experience**, which is
a named requirement in a large share of Data Analyst postings. Added.

**b) Understated experience.** The site said "3 years" and the hero blurb said
"Three years across energy, telecom and healthcare." Actual: 5 years across four
companies and two countries. Corrected to 5, and healthcare/consumer-tech added
to the blurb.

**c) Overstated forecast accuracy.** The site claimed `0.8–1.0% MAPE` for the AQI
project. The repo README reports **0.8–3.2%** across all 26 cities — the 0.8–1.0%
figure covers only the four cities with complete data. Mumbai (2.9%) and Kolkata
(3.2%) have documented data gaps.

Corrected to `0.8–3.2% MAPE across all cities — 0.8–1.0% where data is complete`.

This is a stronger claim, not a weaker one. Stating the range *and* the reason
demonstrates you understand your own model's limits. The original version would
not survive a technical interviewer opening the repo — and they do open the repo.

**d) Unsupported skill claim.** The skills list included **Snowflake**, which
appears nowhere in `user.md`, the work history, or any of the 8 repositories.
Removed. Replaced with DuckDB, which you actually use in three projects.

### 4. Skills reconciled

Five groups became six. Added an **AI & Engineering** group (OpenAI API, Ollama,
RAG, PyTorch, FastAPI, Next.js/React) — previously the site gave no signal that
you build AI systems, despite half your portfolio being exactly that.

### 5. Identity

Added `profile.display` = `Prudhvi "Paddy" Kadamuthuri`, rendered in the hero.
The formal name stays primary everywhere else (title tag, résumé, meta), so a
recruiter matching the domain to your CV sees no mismatch, while a global
audience gets a pronounceable handle. Typographic curly quotes, not straight.

### 6. Domain

`astro.config.mjs` `site` set to `https://prudhvik.dev`. Apex domain means no
`base` path, which removes the most common Astro deployment failure.

---

## Verification

Every check below was run and passed. Reproducible from the shell.

**1. Module integrity** — all 12 barrel exports resolve, no circular imports.

```
✓ barrel exports all 12 symbols
✓ experience: 4 roles (AGL Pty Ltd, Probe Group, Stride Mental Health, Zomato)
✓ skills: 6 groups / 40 items — Snowflake removed
```

**2. Schema validation** — every project has all 12 required fields, slugs are
unique, categories are valid, `projectBySlug()` resolves.

```
projects: 8 | featured: 4
categories: Analytics=2 Full-stack=2 AI=4
✓ all field + slug + category checks pass
```

**3. Production build** — clean, zero warnings.

```
[build] 1 page(s) built in 475ms
[build] Complete!
```

**4. Rendered-output assertions** — 15 checks against `dist/index.html`. A green
build proves the code compiles; these prove the *content actually rendered*.

```
✓ Paddy in hero              ✓ Zomato present
✓ A/B testing bullet         ✓ 5 yrs stat
✓ featured: AQI              ✓ featured: Churn
✓ featured: VoiceCart        ✓ featured: Ecom AI
✓ corrected MAPE range       ✓ churn baseline 26.5
✓ ROC AUC                    ✓ AI & Engineering skills
✓ absent: stale 3-year claim ✓ absent: unsupported Snowflake
✓ absent: non-featured leaked to homepage

15 passed, 0 failed
```

**5. Live browser** — dev server, real render, DOM inspected.

```
sections:       top, projects, demo, experience, skills, contact
projectCards:   4          (featured only — correct)
brokenImages:   0
emptyLinks:     0
h1Count:        1          (correct document outline)
hScroll:        false      (no horizontal overflow)
console errors: none
```

---

## Decisions and tradeoffs

**Barrel file over direct imports.** Costs one indirection; buys the freedom to
restructure `src/data/` without touching components. Worth it at 5 files, and
Phase 2 will add more.

**Data-driven over hard-coded.** Every string lives in `src/data/`. Phase 1's
case study template is then a single file that generates 8 pages, rather than 8
hand-maintained pages that drift.

**No test framework.** For a static content site the real failure modes are "the
build broke" and "the content didn't render." A green build plus the assertions
above cover both. Adding Vitest here would be ceremony without coverage.

**`featured` flag over slicing the array.** `projects.slice(0, 4)` would make
homepage placement depend on array order — a silent trap the first time someone
reorders the file. An explicit flag says what it means.

---

## Known items carried forward

1. **`user.md` is stale on the AQI project** — it describes a Prophet/DuckDB
   notebook version; the repo is now XGBoost/FastAPI/Docker with 144 tests.
   The site follows the repo. Worth updating `user.md` so future résumé
   generation doesn't regress.

2. **GitHub URLs are unverified.** `projects.js` uses the URL pattern already in
   the repo, but only two were previously in use. The other six should be
   confirmed against your actual GitHub before launch — a 404 on a portfolio
   link is worse than no link.

3. **Résumé PDF is the 3-page master.** A trimmed 2-page version suits a
   portfolio download better.

4. **`astro check` is not wired up.** It hangs prompting to install
   `@astrojs/check`. Not blocking, but worth adding as a dev dependency so type
   diagnostics run in CI later.

---

## Next: Phase 1

Build the `/projects/[slug]` case study template, populate the three strongest
projects as full examples, and review one rendered page before generating the
remaining five.

Estimated: ~3 hours.

---
---

# Technical Summary — Phase 1: Case Studies

**Date:** 2026-08-24 · **Status:** Complete, build green, zero errors
**Nothing committed** — working tree only, as requested.

---

## Objective

Turn the 8 data records from Phase 0 into 8 readable case study pages, from a
single template, and make them reachable.

---

## What was built

### 1. One template, eight pages

`src/pages/projects/[slug].astro` uses Astro's `getStaticPaths()` to generate a
page per project. The build output confirms it:

```
├─ /projects/india-air-quality-forecasting/index.html
├─ /projects/customer-churn-revenue-risk/index.html
├─ /projects/voicecart/index.html
├─ /projects/ecommerce-ai-analytics/index.html
├─ /projects/focusflow-studio/index.html
├─ /projects/resume-matcher/index.html
├─ /projects/ncf-recsys/index.html
├─ /projects/compliance-os/index.html
9 page(s) built in 176ms
```

**Why one template rather than eight pages.** Eight hand-written pages drift —
one gets a section the others don't, and six months later they no longer look
like the same site. A template makes divergence impossible and reduces "add a
project" to appending an object.

### 2. The page structure

Header (category, tag, status chip, name, summary, actions) → **problem → what I
did → what changed** → detail and stack → sibling navigation.

Deliberate choices:

- **The outcome paragraph gets a left rule and primary-colour text.** It carries
  the number, and the number is why anyone reads a case study.
- **Prose is capped at a 680px measure**, roughly 75 characters. The 940px site
  width is right for a card grid and too wide to read comfortably.
- **Status chip is colour-coded** — green for Shipped, warm for In progress.
  Being visibly honest about what's alpha reads as confidence, not weakness.

### 3. No orphans

The homepage shows 4 featured projects. Without something further, the other 4
would have been unreachable pages.

Each case study links to **all seven siblings** at the bottom, so every project
is reachable from every other. Verified programmatically, not assumed.

### 4. Homepage cards now lead to case studies

Card titles previously linked straight to GitHub. They now link to the case
study, with a separate `Code ↗` link beneath.

**Why this matters.** Sending a hiring manager directly to a repository sends
them to a wall of source code. The case study is the argument; the repo is the
evidence behind it. Both are available, in the right order.

---

## Defects found and fixed

All four were found by testing, not by reading the code.

**1. Prose blocks were misaligned.** `.narrow { max-width: 680px }` overrode
`.wrap`'s max-width, which re-centred the block at the narrower width and pushed
its left edge inward — so body copy didn't line up with the `h1` above it.
Caught by measuring `getBoundingClientRect().left` in the browser: `h1` at 24px,
body at 203px.

Fixed by constraining the *content* (`.narrow > *`) instead of the container.
All left edges now measure 24px.

**2. Straight quotes in body copy.** `"Reduce churn" is not an action` rendered
with typewriter quotes. Now curly.

**3. Back link was a 22px tap target.** Below the 44px minimum (WCAG 2.5.5 /
iOS HIG). Fixed with vertical padding plus a negative margin, so the target is
44px while the text stays on its original optical baseline.

**4. Link and button colours failed WCAG AA.** The significant one, and
pre-existing rather than introduced here.

`--series-1` (`#2a78d6`) as text on the light plane measures **4.19:1**, under
the 4.5:1 AA minimum. The primary button was worse: white on that blue is
**4.42:1** in light mode and **3.64:1** in dark.

It could not simply be darkened — `--series-1` is a *data mark* whose
relationship to `--accent-warm` is already CVD-validated in the churn demo.
Moving it would invalidate that work.

**Fix: split the token.**

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--series-1` | `#2a78d6` | `#3987e5` | Data marks — **unchanged** |
| `--link` | `#256bc0` | `#3987e5` | Links, buttons, hover states |
| `--link-ink` | `#ffffff` | `#0d0d0d` | Text on a `--link` background |

Dark mode uses **dark ink on the blue button** rather than white — white was
3.64:1, dark ink is 5.34:1. Declared in all three theme blocks (light,
`prefers-color-scheme`, explicit toggle) so neither mode nor the manual toggle
can fall through to an undefined value.

---

## Verification

**1. Build** — 9 pages, clean, no warnings.

**2. Link integrity** — every internal `href` across all 9 pages resolves to a
built file; every case study has at least one inbound link.

```
scanned 9 pages
8 case studies, all reachable: true
✓ no broken links, no orphans, resume present
```

**3. Structural audit** — 8 case studies checked for exactly one `h1`, a
well-formed `<title>`, a meta description, the repo link, all three spine
sections, the outcome text, every stack chip, and complete sibling nav.

```
audited 8 case studies
✓ all 8 case studies structurally complete
```

**4. Contrast — 16 checks, both themes, WCAG AA.**

```
✓ light body text        7.53:1     ✓ dark body text       10.85:1
✓ light link on plane    5.05:1     ✓ dark link on plane    5.34:1
✓ light link on card     5.19:1     ✓ dark link on card     4.79:1
✓ light btn ink          5.33:1     ✓ dark btn ink          5.34:1
✓ light shipped chip     7.35:1     ✓ dark shipped chip     5.19:1
✓ light wip chip         3.85:1     ✓ dark wip chip         5.39:1
✓ series-1 mark light    4.19:1     ✓ series-1 mark dark    5.34:1
✓ accent mark light      3.75:1     ✓ accent mark dark      6.02:1
```

Note on the last four: non-text data marks are held to WCAG 1.4.11 (3:1 against
the **adjacent background**), not against each other. An earlier version of this
suite compared blue against red directly and reported a false failure — that was
a bad assertion, not a defect. Corrected.

**5. Live browser, desktop (1280px).**

```
alignment:      h1/h2/body all at 24px — aligned: true
outcome width:  680px (reading measure holding)
sibling grid:   3 columns × 3 rows, 7 cards, equal heights per row
hScroll:        false
console errors: none
```

**6. Live browser, mobile (375px).**

```
overflowing elements: []      hScroll: false
sibling grid:         1 column
h1: 30px  ·  lead: 17px       (clamp() scaling correctly)
tap targets < 44px:   none remaining in the case study template
```

**7. Theme integrity** — every colour resolves through a token in both modes;
no hard-coded values leaked into the new template.

**8. Phase 0 regression** — homepage re-checked, 12/12, including confirmation
that `--series-1` is byte-identical and the churn demo is untouched.

---

## Two testing notes, for honesty

Two assertions in this phase failed against **correct** code because the tests
were wrong, not the site:

- A title check expected `&#38;`; Astro emits `&amp;`.
- A token check expected `--series-1: #2a78d6` with a space; the production CSS
  is minified to `--series-1:#2a78d6`.

Both were test bugs. Worth recording because a green suite is only meaningful if
the failures it reports are real — and these two were caught by checking the
actual output rather than assuming the assertion was right.

---

## Decisions and tradeoffs

**Sibling nav shows all 7, not prev/next.** Prev/next is tidier but forces a
linear walk. A hiring manager who liked the churn study should be one click from
VoiceCart, not four. This becomes redundant when `/projects` lands in Phase 2 —
at which point it can shrink to three "related" cards.

**Scoped `<style>` over global CSS.** Astro scopes component styles
automatically, so the case study styles cannot leak into the homepage. Only the
genuinely shared decision — the `--link` token — went into `Base.astro`.

**Left the 42px buttons alone.** `.btn` is 42px against a 44px guideline, and the
theme toggle is 38px. Both are global components from `Base.astro` and outside
Phase 1's scope; they belong in the Phase 3 design pass. Flagged, not silently
changed.

---

## Known items carried forward

1. **Six GitHub URLs still unverified** (carried from Phase 0). Now more urgent —
   every case study has a prominent "View the code" button, so a wrong URL is a
   dead end at the moment of peak interest.
2. **No `/projects` index yet** — the 4 non-featured projects are reachable only
   via sibling nav. Phase 2.
3. **No Open Graph tags** — links pasted into LinkedIn won't preview. Phase 4.
4. **`.btn` 42px and theme toggle 38px** — sub-44px tap targets in the global
   layout. Phase 3.

---

## Next: Phase 2

`/projects` index with category filtering, `/blog` on MDX Content Collections,
`/about`. Estimated ~3 hours.

---
---

# Technical Summary — Carried-Forward Items

**Date:** 2026-08-24 · **Status:** Complete, `astro check` clean, build green
**Nothing committed** — working tree only.

---

## 1. GitHub URLs — two wrong, two nonexistent

The highest-risk item, and worse than expected. Every URL was checked against
the repo's **actual git remote** plus a live HTTP request.

| Project | Assumed | Reality |
|---|---|---|
| India AQI | `india-aqi-forecasting` | ✅ correct |
| Churn | `customer-churn-analysis-telco` | ✅ correct |
| VoiceCart | `voicecart` | ✅ correct |
| FocusFlow | `focusflow` | ✅ correct |
| Resume Matcher | `resume-matcher` | ❌ → **`Personal-ATS-checker`** |
| NCF RecSys | `ncf-recsys` | ❌ → **`netflix-recommendation-engine`** |
| E-Commerce AI | `ecommerce-ai-analytics` | ❌ **not on GitHub — no remote configured** |
| ComplianceOS | `compliance-os` | ❌ **not public — remote set, repo 404s** |

**A trap worth recording.** `github.com/PaddyCH96/resume-matcher` returns HTTP
200 — it *redirects* to `portfolio-website`, a stale rename chain from an
unrelated repo. Trusting that redirect would have pointed the case study at the
wrong project entirely. The local remote is the authority:
`git remote get-url origin` → `Personal-ATS-checker`. Confirmed public,
TypeScript, matching the project.

Redirects are also fragile: creating a new repo named `resume-matcher` later
would silently break the link. Canonical URLs only.

**For the two with no public repo**, `url` is now `null`. The template renders a
quiet, non-interactive "Source not public" note instead of a button that 404s.
A dead link at the moment of peak interest is worse than no link.

`user.md` gained a verified repository table so résumés and cover letters cannot
repeat this mistake.

## 2. Tap targets — all now ≥44px

WCAG 2.5.5 / iOS HIG minimum. Measured in the browser, not assumed.

| Control | Before | After |
|---|---|---|
| `.btn` (all buttons) | 42px | 44px |
| Theme toggle | 38px | 44px |
| Churn "Table view" | 25px | 44px |
| Homepage card links | 22px | 44px |
| Case study back link | 22px | 44px (Phase 1) |

Verified: **20 interactive controls, 0 under 44px.** The churn toggle still
functions after the change (clicked it in-browser and confirmed the table
renders).

One detail: the first attempt at the churn toggle landed on 43px, because
padding math and line-height interact. Replaced with an explicit
`min-height: 44px` — declaring the constraint beats computing it.

## 3. `astro check` — wired up, and it found real bugs

Previously it hung prompting to install its optional dependency. Installed
`@astrojs/check` + `typescript`, added a `tsconfig.json` extending
`astro/tsconfigs/strict`, and moved it into the build:

```json
"build": "astro check && astro build"
```

A type error now fails the build instead of shipping.

It reported **5 errors immediately.** Fixing them meant adding real types, not
silencing them:

- **JSDoc typedefs** for `Project`, `Category`, `Status` and `ChurnSegment`, so
  the data flows typed through the barrel into every component. A missing or
  misspelled field is now a build error.
- **A genuine latent bug** in `ChurnExplorer.astro`:

  ```js
  const baseline = churnSegments.find((s) => s.key === 'overall').rate;
  ```

  Unguarded. If the `overall` segment were ever renamed or removed, this throws
  at build time with an opaque message. Now it fails loudly and explains itself:

  ```js
  const overall = churnSegments.find((s) => s.key === 'overall');
  if (!overall) throw new Error("churnSegments is missing the 'overall' baseline segment");
  ```

Result: **0 errors, 0 warnings, 0 hints** under strict TypeScript.

## 4. Open Graph and canonical URLs

Links pasted into LinkedIn, Slack, iMessage or email now preview with a real
title and description rather than a bare URL. Added to `Base.astro`, so every
page gets them: canonical, `og:type`/`title`/`description`/`url`/`site_name`/
`locale`, Twitter card, author. Case studies declare `og:type=article`; the
homepage is `website`.

**This surfaced a real inconsistency.** Astro's directory build format emits the
canonical as `/projects/voicecart/` **with** a trailing slash, but internal links
omitted it — so every click would have taken a 301 redirect hop. All internal
links now use the canonical form. Verified: no `/projects/` link anywhere lacks
the trailing slash.

No `og:image` yet — previews are text-only cards. Phase 3/4.

## 5. `user.md` corrected

The AQI entry described a superseded Prophet/notebook version. Replaced with the
actual system (XGBoost/FastAPI/Docker, 21 commits, 144 tests, 95% coverage, full
metrics including the honest 0.8–3.2% MAPE range and the reason for it), with a
note that it superseded the earlier version. The churn entry gained its segment
breakdown. Added the verified repository table.

## 6. Typography sweep

`someone else's cloud` used a typewriter apostrophe. Swept all prose fields
(`summary`, `problem`, `approach`, `outcome`) across all 8 projects for straight
quotes and apostrophes — this was the only one. Now checked programmatically.

---

## Verification

```
astro check:        0 errors, 0 warnings, 0 hints (strict)
build:              9 pages, clean
full suite:         data integrity + per-page structure + link graph
                    + content audit  →  0 failures
meta:               9 pages × 7 assertions + link-form check  →  pass
URL handling:       6 with repo link, 2 with "Source not public",
                    0 dead links, 0 null hrefs
tap targets:        20 controls, 0 under 44px
churn demo:         toggle still functional after restyle
prose punctuation:  typographic throughout
```

---

## Deliberately not done

**`/projects` index** — this is Phase 2 scope, a real feature with category
filtering rather than a defect. All 8 projects remain reachable via sibling
navigation in the meantime, so nothing is orphaned. Building it here would have
been doing Phase 2 unasked.

**Trimming the résumé PDF to 2 pages** — no PDF library is available in this
environment, and more importantly *which* content survives the cut is a
judgement call about how you want to be read. That one is yours.

---

## Still open

1. **`ecommerce-ai-analytics` has no git remote** — never pushed. It is a strong
   project (local-first LLM analytics with a semantic KPI layer) and currently
   invisible to anyone reading the site.
2. **`compliance-os` is private or unpushed** — remote configured, repo 404s.
3. **No `og:image`** — link previews are text-only.
4. **Résumé PDF is the 3-page master.**

Items 1 and 2 are the valuable ones: making those repos public converts two
"Source not public" notes into two more pieces of evidence.

---
---

# Technical Summary — Phase 2: Routes

**Date:** 2026-08-24 · **Status:** Complete, `astro check` clean (0/0/0), build green
**Nothing committed** — working tree only.

12 pages, up from 9. Four routes: `/`, `/projects/`, `/blog/`, `/about/`.

---

## What was built

### 1. Navigation

Four routes need a way between them. Added a sticky header to `Base.astro`:
name on the left, Work / Writing / About on the right, with `aria-current="page"`
on the active route and a rule under it.

Also added a **skip link** and a `<main id="main">` landmark — previously the
page had no way for a keyboard or screen-reader user to bypass the nav.

The theme toggle is fixed-position, so the nav reserves right padding to avoid
sitting underneath it.

### 2. `/projects` — the full catalogue

All eight projects, filterable by Analytics / Full-stack / AI, with live counts.

**Filtering is progressive enhancement, not a dependency.** The HTML ships every
project visible and the filter bar marked `hidden`; the script removes `hidden`
on load. Without JavaScript the page is a complete working catalogue rather than
a row of dead buttons. Verified against the built HTML, not just in the browser.

The result count is an `aria-live="polite"` region, so filtering announces
"2 projects in Analytics" rather than silently rearranging the page.

### 3. `/blog` — MDX content collections

`src/content.config.ts` defines the schema; a post missing `title`, `description`
or `date` fails the build.

**Draft handling** uses `import.meta.env.DEV`: drafts are visible in `npm run dev`
so you can preview while writing, and excluded from `npm run build`. Verified
both directions — the draft renders in dev, and neither the post nor its page
exists in `dist/`.

Because the only current post is a draft, `/blog` ships an **empty state** that
points at the case studies rather than showing a bare heading.

One seed post is included as a formatting template, marked `draft: true` and
labelled as a draft in its own body. It is a starting point to edit or delete —
not something written in your voice and published on your behalf.

### 4. `/about`

The analyst → builder narrative, sourced from `user.md`: five years and four
companies, how the work actually gets done, why the projects look like
engineering, what you are looking for. Plus a facts grid and certifications with
status badges.

Content lives in `src/data/about.js`, following the project's own rule that no
copy is hard-coded in a component.

---

## Defects found and fixed

**1. Card titles rendered in ALL CAPS.** `Base.astro` styles `h2` as a small
uppercase section label. The project-card and blog-post titles are `h2` elements
for correct document outline, so they inherited it. Both now explicitly opt out.

Caught by looking at the page. A structural audit would have passed it — the
markup was correct and the heading levels were right.

**2. `--muted` failed WCAG AA on the light theme — 3.41:1.** The significant one,
and pre-existing rather than introduced by Phase 2.

`#898781` is used for tags, timestamps, section labels, the footer and the new
result count — all small text. It measured **3.41:1** against the light plane,
well under the 4.5:1 minimum.

Darkened to `#6e6c66` (**4.98:1** on the plane, **5.11:1** on cards) for light
mode only. The dark-mode value was left untouched; it already passes at 5.41:1.
This affects every page on the site.

**3. The filter count badge sat at `opacity: 0.75`**, dropping white-on-blue to
**3.74:1**. Opacity removed — contrast beats decoration.

**4. Eight deprecation warnings** from `astro:content`'s `z` re-export. Installed
`zod` and imported it directly. `astro check` now reports 0 errors, 0 warnings,
0 hints.

---

## Verification

```
astro check:     0 errors, 0 warnings, 0 hints (strict TypeScript)
build:           12 pages, clean
site audit:      12 pages × landmarks, headings, meta, canonical, OG,
                 null-value checks  →  0 failures
link graph:      no broken links, no orphans, all 4 routes linked
contrast:        20 checks, both themes  →  all pass WCAG AA
```

**Filter behaviour, driven in-browser:**

```
initial  → 8 shown, "8 projects"
Analytics → 2 shown, "2 projects in Analytics", aria-pressed toggled
AI        → 4 shown
Full-stack→ 2 shown
All       → 8 shown
```

**Progressive enhancement, checked in built HTML:**

```
✓ filter bar hidden without JS       ✓ all 8 projects present
✓ no project hidden by default       ✓ result count is a live region
```

**Draft handling:**

```
✓ dev shows draft + Draft badge      ✓ prod excludes it
✓ no page generated for the draft    ✓ empty state renders instead
```

**Mobile (375px):** 23 interactive controls, **0 under 44px**, single-column
grid, no overflow, nav does not wrap, filter still functional.

**Themes:** every new element resolves through a token in both modes — light
muted `#6e6c66`, dark muted `#898781`, chip ink white/dark as appropriate.

---

## Decisions and tradeoffs

**Filtering client-side, not by route.** Separate `/projects/analytics/` pages
would be more "static", but eight projects do not justify four extra routes and
a filter that reloads the page. Client-side keeps it instant and degrades to a
complete catalogue.

**`draft` in frontmatter over a separate directory.** Moving files between
folders to publish invites mistakes. A boolean is visible in the file you are
editing.

**Seed post shipped as a draft.** Publishing writing in your voice that you had
not read would be the wrong default. It exists to show the frontmatter shape and
prove the pipeline renders.

**Blog empty state rather than hiding the route.** A visible "Writing" nav item
that goes somewhere honest is better than a nav that changes shape once you
publish.

---

## Still open

1. **`ecommerce-ai-analytics` has no git remote**, `compliance-os` is private.
   Unchanged from before, still the highest-value ten minutes available.
2. **No `og:image`** — link previews are text-only cards. Phase 3.
3. **No favicon** beyond the inline emoji SVG already in `Base.astro`.
4. **No sitemap or RSS.** Phase 4.
5. **Résumé PDF is the 3-page master.**
6. **The blog has no published posts.** The infrastructure is done; the writing
   is yours.

---

## Next: Phase 3

Design pass, `og:image` generation, favicon, and a broader responsive and
accessibility sweep. Estimated ~3 hours.

---

## Phase 2 — independent re-verification

**Date:** 2026-08-24 (later session)

Phase 2 was already present in the working tree at the start of this session.
Rather than rebuild it and discard working code, it was re-verified from scratch
against a clean build.

**Everything above held up**, with one exception.

### Defect found: homepage had no active nav state

The audit above reports "12 pages × landmarks, headings, meta, canonical, OG →
0 failures", but it did not assert on `aria-current`. Re-running with that check
added:

```
✗ dist/index.html: no active nav state
```

The `nav` array in `Base.astro` contains only `/projects/`, `/blog/` and
`/about/`. The home link is the separate `.nav-home` element, so on `/` **no**
element carried `aria-current="page"` — a screen reader announcing the nav on the
homepage got no indication of where the user was.

Fixed by giving the home link the same treatment as the others:

```astro
<a class="nav-home" href="/" aria-current={isCurrent('/') ? 'page' : undefined}>
```

`isCurrent('/')` already handled the exact-match case correctly; it simply was
never called for the home link.

### Re-verification results

```
astro check:      0 errors, 0 warnings, 0 hints (18 files, strict)
build:            12 pages, clean
site audit:       12 pages × link graph, trailing-slash form, single h1,
                  canonical, og:title, og:description, nav, #main landmark,
                  aria-current, null-value checks  →  0 failures
orphans:          none — all 8 case studies have inbound links
```

**Filter, driven in-browser:** All 8 → Analytics 2 → Full-stack 2 → AI 4 → All 8,
counts matching the data exactly, `aria-pressed` tracking, live region reading
"8 projects".

**Progressive enhancement, from built HTML:** 8 project cards present, **0**
hidden by default, filter bar ships `hidden`, live region present.

**Draft handling, both directions:** dev renders the seed post with a Draft
badge; `dist/blog/hello/` does not exist and the title appears nowhere in
`dist/blog/index.html`.

**Filter pill contrast** (not covered by the earlier suite — these are new
controls):

| | Light | Dark |
|---|---|---|
| Active pill (ink on fill) | 5.33:1 | 5.34:1 |
| Idle pill | 7.53:1 | 10.85:1 |
| Result count | 4.98:1 | 5.41:1 |

All pass AA.

**Mobile (375px):** 0 overflowing elements, 0 controls under 44px, single-column
grid, nav does not wrap.

### A measurement note

An initial mobile check reported horizontal overflow on `/about`. It was an
artifact — the browser pane was collapsed, so `clientWidth` read `0` and every
element appeared to overflow. Re-measured at an explicit 1280×900 and 375×812:
no overflow anywhere. Recorded because a layout "bug" that only exists in the
measuring instrument is worth recognising as such rather than fixing.
