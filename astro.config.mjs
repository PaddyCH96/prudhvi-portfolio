import { defineConfig } from 'astro/config';

// Static output — deploys to GitHub Pages, Netlify, Vercel or any static host.
// If serving from https://<user>.github.io/<repo>, set `base` to '/<repo>'.
export default defineConfig({
  site: 'https://paddych96.github.io',
  output: 'static',
});
