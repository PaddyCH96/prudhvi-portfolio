import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// Local integration: runs the build gates and the generated-asset steps inside
// `astro build` itself, so `build:fast` cannot bypass them (Prohibition 16).
import { assetPipeline } from './build/integration.mjs';

// Static output — deploys to Cloudflare Pages (or any static host).
// `site` is the canonical origin, used for sitemap and absolute OG URLs.
// Serving from the apex domain, so no `base` path is needed.
export default defineConfig({
  site: 'https://prudhvik.dev',
  output: 'static',
  integrations: [mdx(), assetPipeline()],
});