// Single import surface for all site content.
// Consumers should import from here, not from the individual files,
// so the internal split can change without touching components.

export { profile, site, stats } from './profile.js';
export { projects, featuredProjects, categories, projectBySlug, relatedProjects, projectCount, projectCountWord } from './projects.js';
export { experience, skills, education, certifications } from './experience.js';
export { churnSegments } from './churn.js';
export { about } from './about.js';
