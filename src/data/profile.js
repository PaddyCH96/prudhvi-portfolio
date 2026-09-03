// ─────────────────────────────────────────────────────────────
// Identity and site-level configuration.
//
// SOURCING RULE: every claim here must be true in Master/*.yaml
// (Job Hunt OS) or verifiable in the project repo it describes.
// Do not add a claim that isn't backed by one of those.
// ─────────────────────────────────────────────────────────────

import { projectCount } from './projects.js';

export const profile = {
  name: 'Prudhvi Kadamuthuri',
  display: 'Prudhvi Kadamuthuri',
  short: 'Prudhvi',
  headline: 'Data Analyst · BI & Analytics Engineering',
  // Kept to four lines at 375px so the four stat cards clear the fold on a
  // 667px-tall phone (D-04). The years and the sector list are the evidence
  // and stay; the closing clause about shipping tooling went to make room —
  // the projects demonstrate it better than a sentence claiming it does.
  blurb:
    'I turn messy operational data into dashboards, forecasts and pipelines that hold up in production. Five years across energy, telecom, healthcare and consumer tech.',
  location: 'Hyderabad, India',
  email: 'prudhvi.kadamuthuri.dev@gmail.com',
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
  // Derived, not literal: the catalogue changed size under D-24 and this
  // string went stale the same day. Anything that counts projects reads from
  // projects.length so the next catalogue edit cannot leave a wrong number here.
  { value: String(projectCount), label: 'Projects shipped' },
  { value: '$139K', unit: '/mo', label: 'Revenue risk quantified' },
];
