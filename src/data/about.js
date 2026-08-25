// ─────────────────────────────────────────────────────────────
// The /about narrative. Same sourcing rule as everything else:
// nothing here that isn't true in Master/*.yaml or a repo.
// ─────────────────────────────────────────────────────────────

export const about = {
  heading: 'About',
  lead:
    'I am a data analyst who kept building the tools instead of just asking for them.',

  /** @type {{ title: string, body: string[] }[]} */
  sections: [
    {
      title: 'The short version',
      body: [
        'Five years of analytics across energy, telecom, healthcare and consumer tech — four companies, two countries. Operational analysis at AGL in Melbourne, workforce forecasting at Probe, an NDIS data pipeline at Stride in Brisbane, and A/B testing for marketing campaigns at Zomato in Hyderabad.',
        'Master of Data Analytics from RMIT, with Distinction. Currently based in Hyderabad and working remotely.',
      ],
    },
    {
      title: 'How I actually work',
      body: [
        'Most analyst roles hand you a question and a messy table. The interesting part is rarely the model — it is figuring out what the business is really asking, then making the answer land in a form someone can act on.',
        'At AGL that meant SQL profiling that lifted data reliability by 25%, because the dashboards were only as good as the integrations feeding them. At Probe it meant forecasting daily call volumes for a 200–500 agent contact centre, where being wrong by 10% is a staffing problem, not a metrics problem.',
        'The habit that shows up everywhere: I ship the tooling alongside the analysis. A finding that lives in a notebook nobody opens has not actually changed anything.',
      ],
    },
    {
      title: 'Why the projects look like engineering',
      body: [
        'Somewhere between building dashboards and automating the pipelines behind them, the line between analysis and engineering stopped being useful. So I stopped defending it.',
        'The air quality system is a production forecasting service — ingestion, 66 engineered features per city, XGBoost models, a REST API, 144 tests, Docker. VoiceCart is a full product with authentication, background workers and payments. The e-commerce platform runs a local LLM so revenue data never leaves the machine.',
        'None of that was assigned to me. It is what happens when an analyst gets curious about the layer underneath.',
      ],
    },
    {
      title: 'What I am looking for',
      body: [
        'Data Analyst, BI Analyst or Analytics Engineer roles — remote, or based in Hyderabad. I am equally interested in AI engineering work where the problem is genuinely about data rather than about wiring up an API.',
        'The teams I do my best work with are small, close to the decision, and more interested in whether the number is right than in who produced it.',
      ],
    },
    {
      title: 'Outside the job description',
      body: [
        'I care about how things look and read. The colour system on this site is validated for colour-vision deficiency in both light and dark modes, and the interactive chart never carries meaning through colour alone — because a chart that excludes 8% of men is a broken chart.',
        'I write about what I build, mostly the parts that went wrong.',
      ],
    },
  ],

  /** Honest, checkable facts. */
  facts: [
    { label: 'Based in', value: 'Hyderabad, India' },
    { label: 'Experience', value: '5 years, 4 companies' },
    { label: 'Education', value: 'MSc Data Analytics, RMIT (Distinction)' },
    { label: 'In progress', value: 'Azure Data Engineer Associate (DP-203)' },
  ],
};
