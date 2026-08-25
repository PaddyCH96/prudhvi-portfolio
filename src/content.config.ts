import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Import zod directly — the `z` re-export from astro:content is deprecated.
import { z } from 'zod';

// Posts are Markdown/MDX files in src/content/blog/.
// The schema is the contract: a post missing a field fails the build rather
// than rendering a half-empty page.
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    /** Drafts are excluded from the production build. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
