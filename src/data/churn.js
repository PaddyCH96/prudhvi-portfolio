// ─────────────────────────────────────────────────────────────
// Real published findings from the churn study. The interactive
// demo uses ONLY these four figures — no synthetic per-customer
// data is generated anywhere in this site.
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {object} ChurnSegment
 * @property {string} key
 * @property {string} label
 * @property {number} rate   churn percentage
 * @property {string} note
 */

/** @type {ChurnSegment[]} */
export const churnSegments = [
  { key: 'overall',  label: 'All customers',                  rate: 26.5, note: 'Baseline across all 7,043 customers' },
  { key: 'tenure',   label: 'First 6 months',                 rate: 54.3, note: 'Newest cohort — highest risk in the study' },
  { key: 'contract', label: 'Month-to-month contract',        rate: 42.7, note: 'No commitment, easiest to leave' },
  { key: 'bundle',   label: 'Tech Support + Online Security', rate: 9.0,  note: 'The protective bundle — under half the baseline' },
];
