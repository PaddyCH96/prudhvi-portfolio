// ─────────────────────────────────────────────────────────────
// Work history, skills and education.
// Ordered most-recent-first. Sourced from Master/*.yaml.
// ─────────────────────────────────────────────────────────────

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
      'Forecast daily call volumes for a 200–500 agent contact centre',
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
      'Built an end-to-end Python and SQL pipeline over ~500 NDIS participant records, improving service-delivery insights by 15%',
      'Designed a Power BI forecasting dashboard for clinical teams, raising resource allocation accuracy by 15%',
    ],
  },
  {
    role: 'Data Reporting Analyst',
    org: 'Zomato',
    sector: 'Food-tech / Consumer',
    place: 'Hyderabad, India',
    dates: 'Aug 2018 – Jul 2019',
    points: [
      'Ran A/B tests on marketing campaigns using t-tests and chi-squared significance testing',
      'Built Tableau dashboards tracking city-level restaurant metrics',
      'Conducted market research supporting campaign and expansion decisions',
    ],
  },
];

// Skills are grouped by how a hiring manager scans, not by taxonomy.
// Every item is demonstrated in the work history or a shipped project.
export const skills = [
  {
    group: 'Data & SQL',
    items: ['Advanced SQL / T-SQL', 'Stored procedures & views', 'SQL Server', 'PostgreSQL', 'DuckDB', 'Databricks'],
  },
  {
    group: 'BI & Visualisation',
    items: ['Power BI', 'DAX', 'Power Query (M)', 'Row-level security', 'Tableau', 'Streamlit', 'Plotly', 'Excel'],
  },
  {
    group: 'Python & Analysis',
    items: ['Python', 'Pandas', 'NumPy / SciPy', 'statsmodels', 'scikit-learn', 'XGBoost', 'A/B testing', 'Forecasting'],
  },
  {
    group: 'Pipelines & Cloud',
    items: ['Azure Data Factory', 'Synapse Analytics', 'Data Lake', 'Alteryx', 'Power Automate', 'Docker', 'Git'],
  },
  {
    group: 'AI & Engineering',
    items: ['OpenAI API', 'Ollama (local LLMs)', 'RAG architecture', 'PyTorch', 'FastAPI', 'Next.js / React'],
  },
  {
    group: 'Ways of working',
    items: ['Requirements definition', 'BRD / FRD', 'Data mapping', 'Visio process flows', 'Agile / Scrum'],
  },
];

export const education = [
  {
    title: 'MSc Data Analytics',
    org: 'RMIT University, Melbourne',
    detail: 'Distinction · Advanced Analytics (SAS)',
  },
  {
    title: 'BE Electronics & Communication',
    org: 'Vasavi College of Engineering, Hyderabad',
    detail: '',
  },
];

export const certifications = [
  { name: 'SQL (Advanced)', status: 'Certified' },
  { name: 'RMIT–SAS Advanced Analytics', status: 'Certified' },
  { name: 'Microsoft Azure Data Engineer Associate (DP-203)', status: 'In progress' },
];
