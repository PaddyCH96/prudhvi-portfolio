// ─────────────────────────────────────────────────────────────
// Identity and site-level configuration.
//
// SOURCING RULE: every claim here must be true in Master/*.yaml
// (Job Hunt OS) or verifiable in the project repo it describes.
// Do not add a claim that isn't backed by one of those.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Prudhvi Kadamuthuri',
  // Shown in the hero so global recruiters have a pronounceable handle
  // while the formal name stays primary on all written materials.
  display: 'Prudhvi \u201CPaddy\u201D Kadamuthuri',
  short: 'Paddy',
  headline: 'Data Analyst · BI & Analytics Engineering',
  blurb:
    'I turn messy operational data into things people actually use — dashboards, forecasts, and pipelines that hold up in production. Five years across energy, telecom, healthcare and consumer tech, and a habit of shipping the tooling as well as the analysis.',
  location: 'Hyderabad, India',
  email: 'paddyramakrishna@outlook.com',
  linkedin: 'https://www.linkedin.com/in/prudhvikadamuthuri/',
  github: 'https://github.com/PaddyCH96',
  resume: 'Prudhvi_Kadamuthuri_Resume.pdf',
};

export const site = {
  domain: 'prudhvik.dev',
  url: 'https://prudhvik.dev',
  description:
    'Data Analyst with 5 years across energy, telecom, healthcare and consumer tech. SQL, Power BI, Python, Azure — plus production ML systems and full-stack AI products.',
};

export const stats = [
  { value: '5', unit: 'yrs', label: 'Analytics experience' },
  { value: '700K+', label: 'Records modelled' },
  { value: '8', label: 'Projects shipped' },
  { value: '$139K', unit: '/mo', label: 'Revenue risk quantified' },
];
