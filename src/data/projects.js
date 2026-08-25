// ─────────────────────────────────────────────────────────────
// All shipped projects. Facts verified against each repo's README
// and git history on 2026-08-24 — see notes on individual entries.
//
// Field contract:
//   slug      URL segment for /projects/[slug]
//   category  'Analytics' | 'Full-stack' | 'AI'  (drives filtering)
//   featured  surfaces on the homepage
//   problem / approach / outcome  the case study spine
//   points    scannable proof, used on cards and detail pages
//   url       public repo, or null when there is no public repo. null renders
//             an honest "not public" note instead of a dead link — every URL
//             here was verified against the repo's actual git remote and a
//             live HTTP check on 2026-08-24.
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
    slug: 'india-air-quality-forecasting',
    name: 'India Air Quality Forecasting',
    tag: 'Machine Learning · Production',
    category: 'Analytics',
    featured: true,
    status: 'Shipped',
    url: 'https://github.com/PaddyCH96/india-aqi-forecasting',
    summary:
      'A production-grade forecasting system for air quality across 26 Indian cities, built end to end — ingestion, feature engineering, model, API and dashboard.',
    problem:
      'Air quality data for India is fragmented across CPCB and OpenAQ, riddled with gaps, and published as raw readings rather than forecasts. Nobody could answer a simple question: what will the air be like next week, and how much should I trust that number?',
    approach:
      'Built the full pipeline — ingestion and cleaning across two sources, 66 engineered features per city (lags, rolling statistics, seasonal cycles, pollutant interactions), XGBoost and Random Forest models with time-series cross-validation, and provenance tracking that tags every row as real or synthetic. Wrapped in a FastAPI service and a six-page dashboard.',
    outcome:
      'Forecasts land at 0.8–1.0% MAPE in cities with complete data and 0.8–3.2% across all 26 — 10–20× better than moving-average and seasonal-naive baselines. 144 tests at 95% coverage, deployed as a 4-service Docker Compose stack.',
    points: [
      '700K+ records across 26 cities and 12 pollutants (5.5 years of CPCB + OpenAQ data)',
      '0.8–3.2% MAPE across all cities — 0.8–1.0% where data is complete',
      '10–20× better than moving-average and seasonal-naive baselines',
      '66 engineered features per city with time-series cross-validation and provenance tracking',
      '144 automated tests at 95% coverage; deployed via Docker Compose across 4 services',
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
    slug: 'voicecart',
    name: 'VoiceCart',
    tag: 'AI Product · Full-stack',
    category: 'AI',
    featured: true,
    status: 'Shipped',
    url: 'https://github.com/PaddyCH96/voicecart',
    summary:
      'An AI ad generator for Indian small businesses — record a voice note, get back a finished audio or video ad in any of 11 Indian languages.',
    problem:
      'Small business owners in India cannot afford an agency and cannot operate a video editor. They can, however, describe their shop out loud in their own language. The gap between that and a publishable ad is entirely mechanical.',
    approach:
      'Built a pipeline that transcribes the recording (Whisper), generates marketing copy (GPT-4o-mini), converts it to speech (ElevenLabs Multilingual v2), and renders a 9:16 video through Cloudinary. Added a layered timeline editor, background job processing for long renders, subscriptions and payments.',
    outcome:
      'A complete product rather than a demo — auth, rate limiting, background workers, and payments all implemented, covered by 95 unit tests, 20 component tests and 14 Playwright E2E scenarios.',
    points: [
      'Voice-to-ad pipeline across 11 Indian languages',
      'Whisper transcription → GPT-4o-mini copy → ElevenLabs TTS → Cloudinary video render',
      'Background job processing via Redis/BullMQ for long-running renders',
      'Razorpay payments, subscriptions, JWT auth and rate limiting',
      '95 unit + 20 component + 14 Playwright E2E tests',
    ],
    stack: ['Next.js 16', 'React 19', 'PostgreSQL/Prisma', 'Redis/BullMQ', 'OpenAI', 'ElevenLabs', 'Cloudinary'],
  },
  {
    slug: 'ecommerce-ai-analytics',
    name: 'E-Commerce AI Analytics',
    tag: 'Analytics Platform · Local LLM',
    category: 'AI',
    featured: true,
    status: 'Alpha',
    url: null,   // not pushed to GitHub yet — no remote configured
    summary:
      'A local-first analytics platform for DTC brands — semantic KPI calculations with AI-generated insights, running entirely on your own machine.',
    problem:
      'DTC brands sit on the metrics that matter — CAC, LTV, MER, retention — but the definitions drift between tools and the insight layer usually means shipping your revenue data to someone else\u2019s cloud.',
    approach:
      'Encoded the metric definitions in a YAML business ontology so CAC means one thing everywhere, then built domain-specific agents (Marketing, Retention, Finance, Operations) on top of a local Ollama model. DuckDB does the analytical work in-process — no warehouse required.',
    outcome:
      'A working metric engine and insight engine with confidence scoring, running with zero data leaving the machine. Alpha stage — the architecture is proven, the surface area is still growing.',
    points: [
      'Semantic KPI layer (CAC, LTV, MER, retention) defined in a YAML business ontology',
      'Domain-specific agents for Marketing, Retention, Finance and Operations',
      'AI insight generation with confidence scoring',
      'Local-first — runs on Ollama (qwen2.5-coder:7b), no data leaves the machine',
    ],
    stack: ['FastAPI', 'DuckDB', 'SQLAlchemy', 'Ollama', 'Streamlit', 'Altair', 'Plotly'],
  },
  {
    slug: 'focusflow-studio',
    name: 'FocusFlow Studio',
    tag: 'Full-stack · Local-first',
    category: 'Full-stack',
    featured: false,
    status: 'Shipped',
    url: 'https://github.com/PaddyCH96/focusflow',
    summary:
      'A productivity workstation combining Pomodoro and Flowmodoro timers, Pranayama breathing, kanban, journaling and a whiteboard — open source, zero telemetry.',
    problem:
      'Productivity tools each own one slice of the workday and all of them phone home. Running six tabs to get through a focused morning is its own kind of distraction.',
    approach:
      'Built a single full-stack app covering timers, breathing exercises, tasks, journaling, audio and a whiteboard, with five handcrafted themes. Packaged as Docker Compose so it runs entirely on your own machine.',
    outcome:
      'A finished, self-hosted app with zero telemetry, covered by Vitest and pytest suites.',
    points: [
      'Pomodoro + Flowmodoro timers with Pranayama breathing exercises',
      'Kanban tasks, journaling, audio tracks, voice notes and whiteboard in one app',
      'Five handcrafted themes; local-first with zero telemetry',
      'Runs via Docker Compose; Vitest and pytest test suites',
    ],
    stack: ['Next.js 16', 'React 19', 'FastAPI', 'PostgreSQL 15', 'Docker Compose', 'Framer Motion'],
  },
  {
    slug: 'resume-matcher',
    name: 'Resume Matcher',
    tag: 'AI Product · Privacy-first',
    category: 'AI',
    featured: false,
    status: 'Shipped',
    url: 'https://github.com/PaddyCH96/Personal-ATS-checker',
    summary:
      'An AI platform for job seekers — parses résumés, scores them against a job description, rewrites bullets, and tracks applications. Nothing is stored server-side.',
    problem:
      'ATS filtering is opaque. Applicants cannot see why they were screened out, and the tools that claim to help want you to upload your entire work history to their servers.',
    approach:
      'Built PDF parsing and ATS match scoring in the browser, with OpenAI handling bullet rewrites and tailored document generation. All state lives in localStorage — there is no server-side persistence to leak.',
    outcome:
      'A working, deployable tool with match scoring, keyword gap analysis and an application tracker, covered by four test suites.',
    points: [
      'PDF résumé parsing with ATS match scoring and missing-keyword detection',
      'AI bullet rewriting and tailored résumé/cover-letter generation',
      'Privacy-first — localStorage only, no server-side data persistence',
      'Four test suites covering bullet extraction, keyword extraction, PDF download and match engine',
    ],
    stack: ['Next.js 16', 'React 19', 'OpenAI GPT-4o-mini', 'jsPDF', 'pdfjs-dist', 'Vitest'],
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
    url: null,   // repo is private / not yet published
    summary:
      'GST compliance automation for Indian SMEs — invoice parsing, anomaly detection, and a rules engine that scores filing risk before it becomes a penalty.',
    problem:
      'GST filing for Indian SMEs is manual, deadline-driven and unforgiving. The errors that trigger penalties are usually visible in the invoice data weeks earlier — nobody is looking.',
    approach:
      'Combined OCR with LLM extraction to parse invoices, then built a rules engine that scores compliance risk 0–100 and flags anomalies ahead of the filing deadline. GSTR-1 and 3B filing paths are automated on top.',
    outcome:
      'MVP stage — invoice ingestion, anomaly detection and risk scoring are working. Active development.',
    points: [
      'Invoice parsing via OCR + LLM extraction',
      'GSTR-1 / GSTR-3B filing automation',
      'Compliance rules engine with 0–100 risk scoring and anomaly detection',
      'Bank reconciliation and workflow management',
    ],
    stack: ['Next.js', 'FastAPI', 'SQLAlchemy', 'SQLite', 'PyTesseract', 'OpenAI'],
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

/**
 * @param {string} slug
 * @returns {Project | undefined}
 */
export function projectBySlug(slug) {
  return projects.find((p) => p.slug === slug);
}
