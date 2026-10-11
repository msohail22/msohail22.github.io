import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './notes-content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    topic: z.string(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['seed', 'drafting', 'done']).default('seed'),
    lane: z
      .enum(['clickhouse', 'homelab', 'low-level-lab', 'problem-solving', 'none'])
      .default('none'),
    blog: z.enum(['no', 'ready', 'published']).default('no'),
    blog_url: z.string().nullish(),
    source: z.string().nullish(),
    summary: z.string().optional(),
  }),
});

export const collections = { blog };
