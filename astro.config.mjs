import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// Local integration: runs the build gates and the generated-asset steps inside
// `astro build` itself, so `build:fast` cannot bypass them (Prohibition 16).
import { assetPipeline } from './build/integration.mjs';
// Derived, not literal: the domain changed once already (prudhvik.dev →
// prudhvi.dev), and this file, tests/gates/og.test.mjs and build/card.mjs
// each held their own hardcoded copy of it before this. src/data/profile.js
// is the single source now.
import { site } from './src/data/profile.js';

// Static output — deploys to Cloudflare (or any static host).
// `site` is the canonical origin, used for sitemap and absolute OG URLs.
// Serving from the apex domain, so no `base` path is needed.
export default defineConfig({
  site: site.url,
  output: 'static',
  integrations: [mdx(), assetPipeline()],
});