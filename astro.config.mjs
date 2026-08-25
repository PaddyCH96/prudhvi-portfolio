import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// Static output — deploys to Cloudflare Pages (or any static host).
// `site` is the canonical origin, used for sitemap and absolute OG URLs.
// Serving from the apex domain, so no `base` path is needed.
export default defineConfig({
  site: 'https://prudhvik.dev',
  output: 'static',
  integrations: [mdx()],
});