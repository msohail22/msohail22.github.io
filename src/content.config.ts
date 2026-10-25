import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Posts live in the notes repo, reached through the git-ignored `notes-content`
// symlink. Two shapes feed this collection:
//   blog-automation/daily/<date>/learning-blog.md   the current pipeline
//   blog-automation/archive/*.md                    posts written before it
// Only `learning-blog.md` is matched inside daily/, so the tweet drafts beside it
// (prs.md, codeforces.md, ...) never leak onto the site.
const blog = defineCollection({
  loader: glob({
    pattern: ['daily/*/learning-blog.md', 'archive/*.md'],
    base: './notes-content/blog-automation',
    // The URL comes from `slug`, never the path: the daily path would give
    // /blog/2026-10-25/learning-blog/ and the archive path a date prefix.
    generateId: ({ entry, data }) => {
      const slug = data.slug;
      if (typeof slug === 'string' && slug.trim() !== '') return slug.trim();
      // A day folder holds a `learning-blog.md` stub long before it holds a post.
      // Only a post asking to be published needs a real slug; anything else gets
      // a path-derived id and is filtered out of every page by `blog === 'ready'`.
      if (data.blog === 'ready') {
        throw new Error(
          `Missing \`slug\` in frontmatter of ${entry}, which is marked \`blog: ready\`. ` +
            'Add a kebab-case slug; it becomes the post URL.',
        );
      }
      return entry.replace(/\.md$/, '').replace(/\//g, '-');
    },
  }),
  schema: z.object({
    title: z.string(),
    // Optional in the schema, enforced by generateId once `blog: ready` is set.
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be kebab-case: lowercase, digits, single hyphens')
      .optional(),
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
