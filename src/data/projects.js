// ─────────────────────────────────────────────────────────────
// All shipped projects. Facts verified against each repo's README
// and git history on 2026-08-24 — see notes on individual entries.
//
// Field contract:
//   slug      URL segment for /projects/[slug]
//   category  'Analytics' | 'Full-stack' | 'AI'  (drives filtering)
//   featured  surfaces on the homepage
//   problem / approach / outcome  the case study spine. `outcome` is prose and
//             carries NO numeric guarantee — the old "must contain a number"
//             rule was never enforceable through a JSDoc string type and was
//             false in the shipped data. The headline number lives in
//             `cardStat`, where it can actually be checked.
//   points    scannable proof, used on cards and detail pages
//   url       public repo, or null when there is no public repo. null renders
//             an honest "not public" note instead of a dead link — every URL
//             here was verified against the repo's actual git remote and a
//             live HTTP check on 2026-08-24.
//   cardStat  the share-card headline number, authored by hand — never derived
//             from `outcome` prose, because only a person can judge which
//             figure is the headline. `null` is a DECISION, not an oversight:
//             it means this project has no defensible number yet, and the card
//             renders the category · status chip instead. A MISSING key is the
//             oversight, and `tests/gates/cardstat.test.mjs` tells the two
//             apart. Sourcing rule (C-17): every non-null `value` must trace to
//             a line in that project's own `points[]` or to its repo README —
//             each one below names its source in a trailing comment. If you
//             cannot source a number, write `null`. Do not author a plausible
//             one; it gets printed at 104px onto a share card.
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {'Analytics' | 'Full-stack' | 'AI'} Category
 * @typedef {'Shipped' | 'Alpha' | 'In progress'} Status
 *
 * @typedef {object} Project
 * @property {string}   slug      URL segment for /projects/[slug]
 * @property {string}   name
 * @property {string}   tag       small uppercase label on the card
 * @property {Category} category  drives filtering
 * @property {boolean}  featured  surfaces on the homepage
 * @property {Status}   status
 * @property {string|null} url    public repo, or null when there is none
 * @property {{value: string, unit: string}|null} cardStat  share-card headline;
 *           null → the category · status chip. Authored, never derived.
 * @property {string}   summary
 * @property {string}   problem
 * @property {string}   approach
 * @property {string}   outcome
 * @property {string[]} points
 * @property {string[]} stack
 */

/** @type {Category[]} */
export const categories = ['Analytics', 'Full-stack', 'AI'];

/** @type {Project[]} */
export const projects = [
  {
    // Rewritten 2026-09-04 against github.com/PaddyCH96/india-aqi-forecasting's
    // top-level README as of commit 5f30480 ("feat: honest forecasting...",
    // 2026-08-30) — the repo's own most recent correction. CASE_STUDY.md and
    // INSIGHTS.md in that repo still carry the PRE-correction numbers (last
    // touched 2026-07-03, untouched by the fix commit) and were not used as a
    // source here. The previous version of this entry stated 0.8–3.2% MAPE,
    // "10–20× better than baselines" — the README now explicitly names that
    // range as a leakage artifact and replaces it with the honest benchmark
    // below. cardStat is null on purpose: the honest finding is that the model
    // does NOT decisively beat a naive baseline, and authoring a single
    // flattering number here would be the exact mistake this entry replaces.
    slug: 'india-air-quality-forecasting',
    name: 'India Air Quality Forecasting',
    tag: 'Machine Learning · Production',
    category: 'Analytics',
    featured: true,
    status: 'Shipped',
    url: 'https://github.com/PaddyCH96/india-aqi-forecasting',
    summary:
      'A production forecasting system for air quality across 26 Indian cities — and an honest benchmark showing that, for most cities, it barely beats assuming tomorrow looks like today.',
    problem:
      'Air quality data for India is fragmented across CPCB and OpenAQ, riddled with gaps, and published as raw readings rather than forecasts. I wanted to know whether daily AQI is actually predictable enough to act on — not just whether a model could be trained on it.',
    approach:
      'Built the full pipeline — ingestion and cleaning across CPCB and OpenAQ, 66 engineered features per city, and XGBoost models trained per city per forecast horizon (1/3/7/14 days). Benchmarked every one of them on a rolling backtest against persistence — literally assuming tomorrow looks like today — because a forecast that cannot beat that has not earned its complexity. That backtest caught two features that had leaked the target into the inputs: a z-score normalised against the value being predicted (correlating r=1.000 with it) and rolling means whose window included the current day. Both are fixed, with a regression test that fails if either returns.',
    outcome:
      'The honest result is a negative one, and it is the actual finding: across 6 cities and 4 horizons, persistence beats or ties the model almost everywhere — XGBoost only reliably wins for Delhi, and only 1–3 days out. What separates cities is data density, not algorithm: Delhi has 1,451 training days and forecasts best; Mumbai has 227 (61% of its daily readings are missing) and errors run 2–3× higher at every horizon. 159 tests, including the regression suite that keeps the leak from coming back.',
    cardStat: null,
    points: [
      '700K+ records across 26 cities and 12 pollutants (5.5 years of CPCB + OpenAQ data)',
      'Benchmarked per-city, per-horizon XGBoost against a persistence baseline on a rolling backtest — persistence wins or ties almost everywhere; XGBoost only reliably beats it for Delhi at 1–3 days',
      'Found and fixed two features that leaked the target into the inputs, including one correlating r=1.000 with the value being predicted — now covered by a regression test that fails if either returns',
      'Data density, not model choice, explains the accuracy gap — Delhi (1,451 training days) forecasts far better than Mumbai (227 days, 61% of readings missing)',
      '159 tests, deployed via Docker Compose with a live Streamlit dashboard and FastAPI service',
    ],
    stack: ['Python', 'XGBoost', 'NumPy/SciPy', 'FastAPI', 'PostgreSQL', 'Streamlit', 'Docker'],
  },
  {
    slug: 'customer-churn-revenue-risk',
    name: 'Customer Churn & Revenue Risk',
    tag: 'Analysis · Executive Reporting',
    category: 'Analytics',
    featured: true,
    status: 'Shipped',
    url: 'https://github.com/PaddyCH96/customer-churn-analysis-telco',
    summary:
      'A segmentation study of 7,043 telecom customers that put a number on revenue at risk and turned it into a retention plan leadership could act on.',
    problem:
      'A telecom subscription business knew it had a churn problem but not where the problem lived, what it cost, or which lever to pull first. \u201CReduce churn\u201D is not an action.',
    approach:
      'Segmented all 7,043 customers across contract type, tenure and service bundle, then modelled churn probability with logistic regression, random forest and gradient boosting. Scored every customer into risk tiers and attached revenue to each tier so the finding arrived denominated in dollars, not percentages.',
    outcome:
      'Identified $139K/month of revenue at risk and found the protective bundle — Tech Support + Online Security customers churn at 9.0% against a 26.5% baseline. Delivered as a self-contained executive report for non-technical leadership.',
    cardStat: { value: '$139K', unit: '/mo at risk' }, // points[0]
    points: [
      'Quantified $139K/month of revenue at risk across 7,043 customers',
      'Month-to-month contracts churned at 42.7%; first-6-month cohorts at 54.3%',
      'Found the bundle that mattered: Tech Support + Online Security churned at 9.0% vs 26.5% overall',
      'Best model ROC AUC 0.8418 (logistic regression); all customers scored into risk tiers',
      'Delivered as a self-contained executive report for non-technical leadership',
    ],
    stack: ['Python', 'Pandas', 'DuckDB', 'scikit-learn', 'statsmodels', 'Plotly', 'Streamlit'],
  },
  {
    slug: 'ecommerce-ai-analytics',
    name: 'E-Commerce AI Analytics',
    tag: 'Analytics Platform · Local LLM',
    category: 'AI',
    featured: true,
    status: 'Alpha',
    url: 'https://github.com/PaddyCH96/ecommerce-ai-analytics',
    summary:
      'A local-first analytics platform for DTC brands — semantic KPI calculations with AI-generated insights, running entirely on your own machine.',
    problem:
      'DTC brands sit on the metrics that matter — CAC, LTV, MER, retention — but the definitions drift between tools and the insight layer usually means shipping your revenue data to someone else\u2019s cloud.',
    approach:
      'Encoded the metric definitions in a YAML business ontology so CAC means one thing everywhere, then built domain-specific agents (Marketing, Retention, Finance, Operations) on top of a local Ollama model. DuckDB does the analytical work in-process — no warehouse required.',
    outcome:
      'A working metric engine and insight engine with confidence scoring, running with zero data leaving the machine. Alpha stage — the architecture is proven, the surface area is still growing.',
    cardStat: null, // Alpha — no measured headline yet; renders the AI · Alpha chip
    points: [
      'Semantic KPI layer (CAC, LTV, MER, retention) defined in a YAML business ontology',
      'Domain-specific agents for Marketing, Retention, Finance and Operations',
      'AI insight generation with confidence scoring',
      'Local-first — runs on Ollama (qwen2.5-coder:7b), no data leaves the machine',
    ],
    stack: ['FastAPI', 'DuckDB', 'SQLAlchemy', 'Ollama', 'Streamlit', 'Altair', 'Plotly'],
  },
  {
    slug: 'ncf-recsys',
    name: 'NCF Recommender System',
    tag: 'Deep Learning · Recommenders',
    category: 'AI',
    featured: false,
    status: 'Shipped',
    url: 'https://github.com/PaddyCH96/netflix-recommendation-engine',
    summary:
      'A movie recommendation system built on Neural Collaborative Filtering — full pipeline from preprocessing through training to a served inference API.',
    problem:
      'Classical matrix factorisation assumes user and item interactions combine linearly. Real preference is messier than that, and the gap shows up in ranking quality.',
    approach:
      'Implemented Neural Collaborative Filtering in PyTorch over MovieLens 100K, replacing the dot product with a learned interaction function. Built the full training and evaluation workflow with proper ranking metrics, then served it through FastAPI.',
    outcome:
      'Hit Rate @10 of ~0.54 and NDCG @10 of ~0.31, with trained model artifacts and a demo UI included.',
    cardStat: { value: '0.54', unit: 'Hit Rate @10' }, // points[1]
    points: [
      'Neural Collaborative Filtering implemented in PyTorch on MovieLens 100K',
      'Hit Rate @10 ≈ 0.54, NDCG @10 ≈ 0.31',
      'Full pipeline — preprocessing, training, evaluation with ranking metrics',
      'FastAPI inference backend with a demo UI; trained artifacts included',
    ],
    stack: ['PyTorch', 'scikit-learn', 'FastAPI', 'Next.js'],
  },
  {
    slug: 'compliance-os',
    name: 'ComplianceOS',
    tag: 'AI · RegTech',
    category: 'Full-stack',
    featured: false,
    status: 'In progress',
    url: 'https://github.com/PaddyCH96/compliance-os',
    summary:
      'GST compliance automation for Indian SMEs — invoice parsing, anomaly detection, and a rules engine that scores filing risk before it becomes a penalty.',
    problem:
      'GST filing for Indian SMEs is manual, deadline-driven and unforgiving. The errors that trigger penalties are usually visible in the invoice data weeks earlier — nobody is looking.',
    approach:
      'Combined OCR with LLM extraction to parse invoices, then built a rules engine that scores compliance risk 0–100 and flags anomalies ahead of the filing deadline. GSTR-1 and 3B filing paths are automated on top.',
    outcome:
      'MVP stage — invoice ingestion, anomaly detection and risk scoring are working. Active development.',
    cardStat: null, // In progress — MVP, nothing measured; renders the Full-stack · In progress chip
    points: [
      'Invoice parsing via OCR + LLM extraction',
      'GSTR-1 / GSTR-3B filing automation',
      'Compliance rules engine with 0–100 risk scoring and anomaly detection',
      'Bank reconciliation and workflow management',
    ],
    stack: ['Next.js', 'FastAPI', 'SQLAlchemy', 'SQLite', 'PyTesseract', 'OpenAI'],
  },
  {
    // Facts verified against github.com/PaddyCH96/focusflow's README and
    // repo tree on 2026-09-03. cardStat is null: the README carries no
    // user-facing number defensible as a headline (no usage metric, no
    // benchmark) — a personal tool has a real story without one.
    slug: 'focusflow',
    name: 'FocusFlow Studio',
    tag: 'Full Stack · Self-Hosted',
    category: 'Full-stack',
    featured: false,
    status: 'Shipped',
    url: 'https://github.com/PaddyCH96/focusflow',
    summary:
      'A self-hosted Pomodoro/Flowmodoro workstation — breathing exercises, kanban, journaling, voice notes and a whiteboard, running entirely on your own machine with zero telemetry.',
    problem:
      "Most focus-timer apps are cloud SaaS with an account, tracking and a subscription for what is fundamentally a stopwatch and a task list. Wanted the opposite: Pomodoro and Flowmodoro timers, breathing exercises, kanban, journaling and a whiteboard, all local, closeable without sending a byte anywhere.",
    approach:
      "Built full-stack on Next.js and FastAPI over PostgreSQL, containerised with Docker Compose so the whole stack runs on one machine with no account and no cloud dependency. Hardened it on the way to shipping: a /history endpoint that silently returned nothing — a missing return statement — is fixed, and the project went from zero tests to a Vitest + pytest suite covering the timer, hooks and core API routes.",
    outcome:
      'Ships as a working local-first productivity suite — five themes, Pomodoro/Flowmodoro timers with a Pranayama breathing guide, kanban tasks, session analytics, journaling, an audio player, voice notes and a whiteboard, self-hosted via Docker Compose with no telemetry.',
    cardStat: null,
    points: [
      'Next.js 16 + FastAPI + PostgreSQL, fully containerised via Docker Compose',
      'Fixed a silent bug where /history returned nothing — a missing return statement',
      'Took the project from zero tests to a Vitest + pytest suite across the timer, hooks and core API routes',
      'Pomodoro and Flowmodoro timers, kanban tasks, journaling, voice notes and a whiteboard in one app',
      'Self-hosted, no accounts, zero telemetry',
    ],
    stack: ['Next.js', 'React', 'FastAPI', 'PostgreSQL', 'Docker', 'Vitest', 'pytest'],
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

/**
 * Catalogue size, derived. Every count the site prints reads from here or from
 * `projectCountWord` — a hardcoded "8" is how the last catalogue change went
 * stale in four places at once.
 */
export const projectCount = projects.length;

/** Index 0 is unused; the array is 1-indexed so the lookup reads naturally. */
const COUNT_WORDS = [
  '',
  'One', 'Two', 'Three', 'Four', 'Five',
  'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
];

/**
 * The catalogue size spelled out, for the four prose strings that need a word
 * rather than a digit. Throws outside 1–20 rather than returning undefined: a
 * page reading "undefined projects" is worse than a failed build.
 * @type {string}
 */
export const projectCountWord = (() => {
  const word = COUNT_WORDS[projectCount];
  if (!word) {
    throw new Error(
      `projectCountWord has no word for a catalogue of ${projectCount}. ` +
        `Extend COUNT_WORDS in src/data/projects.js past 20.`
    );
  }
  return word;
})();

/**
 * @param {string} slug
 * @returns {Project | undefined}
 */
export function projectBySlug(slug) {
  return projects.find((p) => p.slug === slug);
}

/**
 * The three projects to surface at the foot of a case study: same-category
 * siblings first, then the rest in file order. File order is the tie-break, so
 * the result is deterministic and the link graph is stable between builds.
 * @param {string} slug
 * @returns {Project[]} exactly 3
 */
export function relatedProjects(slug) {
  const self = projectBySlug(slug);
  if (!self) {
    throw new Error(
      `relatedProjects('${slug}') — no project with that slug. ` +
        `A caller is passing a slug that is not in the catalogue.`
    );
  }
  const others = projects.filter((p) => p.slug !== slug);
  const sameCat = others.filter((p) => p.category === self.category);
  const rest = others.filter((p) => p.category !== self.category);
  const picked = [...sameCat, ...rest].slice(0, 3);
  if (picked.length !== 3) {
    throw new Error(
      `relatedProjects('${slug}') produced ${picked.length}, expected 3. ` +
        `The catalogue has dropped below 4 projects — fix the data, do not add a placeholder.`
    );
  }
  return picked;
}
