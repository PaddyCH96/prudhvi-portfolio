// Content source of truth for the site.
// Figures here are drawn from Master/*.yaml in the Job Hunt OS project —
// every number is one Paddy has already stood behind on his resume.
// Do not add a claim here that isn't true in Master/.

export const profile = {
  name: 'Prudhvi Kadamuthuri',
  short: 'Paddy',
  headline: 'Data Analyst & Builder',
  blurb:
    'I turn messy operational data into things people actually use — dashboards, forecasts, and pipelines that hold up in production. Three years across energy, telecom and healthcare, and a habit of shipping the tooling as well as the analysis.',
  location: 'Hyderabad, India',
  email: 'paddyramakrishna@outlook.com',
  linkedin: 'https://www.linkedin.com/in/prudhvikadamuthuri/',
  github: 'https://github.com/PaddyCH96',
  resume: 'Prudhvi_Kadamuthuri_Resume.pdf',
};

export const stats = [
  { value: '3', unit: 'yrs', label: 'Analytics experience' },
  { value: '700K+', label: 'Records modelled' },
  { value: '85–90%', label: 'Forecast accuracy' },
  { value: '25%', label: 'Data reliability gain' },
];

export const projects = [
  {
    name: 'India Air Quality Forecasting',
    tag: 'Machine Learning · Production',
    url: 'https://github.com/PaddyCH96/india-aqi-forecasting',
    summary:
      'A production-grade forecasting system for air quality across 26 Indian cities, built end to end — ingestion, feature engineering, model, API and dashboard.',
    points: [
      '700K+ records across 26 cities and 12 pollutants (5.5 years of CPCB + OpenAQ data)',
      '0.8–1.0% MAPE — 10–20× better than moving-average baselines',
      '66 engineered features per city with time-series cross-validation and provenance tracking',
      '144 automated tests at 95% coverage; deployed via Docker Compose across 4 services',
    ],
    stack: ['Python', 'XGBoost', 'NumPy/SciPy', 'FastAPI', 'PostgreSQL', 'Streamlit', 'Docker'],
  },
  {
    name: 'Customer Churn & Revenue Risk',
    tag: 'Analysis · Executive Reporting',
    url: 'https://github.com/PaddyCH96/customer-churn-analysis-telco',
    summary:
      'A segmentation study of 7,043 telecom customers that put a number on revenue at risk and turned it into a retention plan leadership could act on.',
    points: [
      'Quantified $139K/month of revenue at risk',
      'Month-to-month contracts churned at 42.7%; first-6-month cohorts at 54.3%',
      'Found the bundle that mattered: Tech Support + Online Security churned at 9.0% vs 26.5% overall',
      'Delivered as a self-contained executive report for non-technical leadership',
    ],
    stack: ['Python', 'Pandas', 'statsmodels', 'Segmentation', 'HTML Report'],
  },
];

export const experience = [
  {
    role: 'Operational Analyst',
    org: 'AGL Pty Ltd',
    sector: 'Energy / Utilities',
    place: 'Melbourne, Australia',
    dates: 'Mar 2024 – Mar 2026',
    points: [
      'Built and maintained 8+ Power BI dashboards — dimensional models, DAX measures, row-level security — hitting 100% pricing accuracy across all customer segments',
      'Wrote complex SQL (stored procedures, views) against relational databases, cutting pipeline turnaround time by 30%',
      'Orchestrated ETL across Azure Data Factory, Synapse Analytics, SQL Database and Data Lake',
      'Diagnosed integration failures through SQL profiling, lifting data reliability by 25%',
    ],
  },
  {
    role: 'Workforce Analyst',
    org: 'Probe Group',
    sector: 'Telecom / CX',
    place: 'Melbourne, Australia',
    dates: 'Jan 2023 – Jan 2024',
    points: [
      'Designed Python and SQL time-series forecasting pipelines reaching 85–90% accuracy, improving resource utilisation by 15%',
      'Built Alteryx workflows blending multi-source feeds into the reporting layer',
      'Automated recurring extraction and cleansing, cutting manual reporting effort by ~20%',
    ],
  },
  {
    role: 'Data Analyst Intern',
    org: 'Stride Mental Health',
    sector: 'Healthcare',
    place: 'Brisbane, Australia',
    dates: 'Mar – Aug 2021',
    points: [
      'Built an end-to-end Python and SQL pipeline over ~500 participant records, improving service-delivery insights by 15%',
      'Designed a Power BI forecasting dashboard for clinical teams, raising resource allocation accuracy by 15%',
    ],
  },
];

export const skills = [
  { group: 'Data & SQL', items: ['Advanced SQL / T-SQL', 'Stored procedures & views', 'SQL Server', 'PostgreSQL', 'Snowflake', 'Databricks'] },
  { group: 'BI & Visualisation', items: ['Power BI', 'DAX', 'Power Query (M)', 'Row-level security', 'Report Builder', 'Tableau', 'Excel'] },
  { group: 'Python & Analysis', items: ['Python', 'Pandas', 'NumPy / SciPy', 'statsmodels', 'XGBoost', 'Statistical analysis', 'Forecasting'] },
  { group: 'Pipelines & Cloud', items: ['Azure Data Factory', 'Synapse Analytics', 'Data Lake', 'Alteryx', 'Power Automate', 'Docker'] },
  { group: 'Ways of working', items: ['Requirements definition', 'BRD / FRD', 'Data mapping', 'Visio process flows', 'Agile / Scrum'] },
];

export const education = [
  { title: 'MSc Data Analytics', org: 'RMIT University, Melbourne', detail: 'Distinction · Advanced Analytics (SAS)' },
  { title: 'BE Electronics & Communication', org: 'Vasavi College of Engineering, Hyderabad', detail: '' },
];

// Real published findings from the churn study — the interactive demo uses
// ONLY these. No synthetic per-customer data is generated anywhere.
export const churnSegments = [
  { key: 'overall',  label: 'All customers',                 rate: 26.5, note: 'Baseline across all 7,043 customers' },
  { key: 'tenure',   label: 'First 6 months',                rate: 54.3, note: 'Newest cohort — highest risk in the study' },
  { key: 'contract', label: 'Month-to-month contract',       rate: 42.7, note: 'No commitment, easiest to leave' },
  { key: 'bundle',   label: 'Tech Support + Online Security', rate: 9.0,  note: 'The protective bundle — under half the baseline' },
];
