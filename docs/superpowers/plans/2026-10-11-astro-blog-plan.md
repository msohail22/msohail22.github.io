# Plan: Astro + Preact + TypeScript blog on GitHub Pages

Repo: `msohail22/msohail22.github.io` (public). Deploy branch: `master`.
Content source: `msohail22/notes` (public), directory `blog/`, only entries with `blog: ready`.

## Global Constraints

- Astro 5+ content layer (`src/content.config.ts` + `glob()` loader). Not the legacy `src/content/config.ts`.
- TypeScript strict. Preact via `@astrojs/preact`. JSX uses `jsxImportSource: "preact"`.
- Zero JavaScript on pages except the one Preact island (`ThemeToggle`, `client:idle`).
- Design stays minimal: system fonts, one accent, light + dark via tokens. No CSS framework.
- Content is NEVER copied into this repo. It is read from `notes-content/`, which is a checkout
  (CI) or a symlink (local). `notes-content` is git-ignored.
- Routes: `/`, `/blog/<id>/`, `/rss.xml`, `/sitemap-index.xml`, `/404.html`. Trailing slash on post URLs.
- Use the exact file contents given below, verbatim.

## Task 1: Scaffold, config, content schema

Create these files with exactly this content.

### `package.json`
```json
{
  "name": "msohail22.github.io",
  "type": "module",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  }
}
```

Then install: `npm install astro @astrojs/preact @astrojs/rss @astrojs/sitemap preact` and
`npm install -D typescript @astrojs/check`.

### `astro.config.mjs`
```js
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://msohail22.github.io',
  trailingSlash: 'ignore',
  integrations: [preact(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
```

### `tsconfig.json`
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

### `src/content.config.ts`
```ts
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
```

### `.gitignore`
Append these lines (keep any existing content):
```
node_modules/
dist/
.astro/
notes-content
```

### Local content link
Create the symlink so `npm run build` works on this machine:
`ln -sfn ../notes notes-content`
Verify `notes-content/blog` resolves. If `../notes/blog` does not exist yet, create it
(`mkdir -p ../notes/blog`) — Task 4 fills it.

**Verify:** `npm run build` completes. Zero posts is acceptable at this stage.

## Task 2: Layout, pages, routing, design

### `src/styles/global.css`
```css
:root {
  --bg: #ffffff;
  --fg: #1a1a1a;
  --muted: #6b6b6b;
  --rule: #e4e4e4;
  --accent: #0a5ad6;
  --code-bg: #f6f6f6;
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg: #121212;
    --fg: #e8e8e8;
    --muted: #9a9a9a;
    --rule: #2c2c2c;
    --accent: #78aaff;
    --code-bg: #1c1c1c;
    color-scheme: dark;
  }
}

:root[data-theme='dark'] {
  --bg: #121212;
  --fg: #e8e8e8;
  --muted: #9a9a9a;
  --rule: #2c2c2c;
  --accent: #78aaff;
  --code-bg: #1c1c1c;
  color-scheme: dark;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font: 16px/1.65 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  padding-inline: 16px;
}

header, main, footer { max-width: 42rem; margin-inline: auto; }

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-block: 1.5rem;
  border-bottom: 1px solid var(--rule);
}

header .home { font-weight: 600; text-decoration: none; color: var(--fg); }
header nav { display: flex; align-items: center; gap: 1rem; }

main { padding-block: 2.5rem; }

footer {
  padding-block: 2rem;
  border-top: 1px solid var(--rule);
  color: var(--muted);
  font-size: 0.875rem;
}

a { color: var(--accent); }

h1 { font-size: 1.75rem; line-height: 1.25; text-wrap: balance; margin-block: 0 0.5rem; }
h2 { font-size: 1.25rem; margin-block: 2rem 0.5rem; text-wrap: balance; }
h3 { font-size: 1.05rem; margin-block: 1.5rem 0.5rem; }

.lede { color: var(--muted); margin-block: 0 2rem; }
.meta { color: var(--muted); font-size: 0.875rem; margin-block: 0 2rem; }

.posts { list-style: none; padding: 0; margin: 0; }

.posts li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding-block: 0.75rem;
  border-bottom: 1px solid var(--rule);
}

.posts time { color: var(--muted); font-size: 0.875rem; font-variant-numeric: tabular-nums; }

button {
  font: inherit;
  font-size: 0.875rem;
  background: none;
  border: 1px solid var(--rule);
  color: var(--fg);
  border-radius: 4px;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
}

button:hover { border-color: var(--accent); color: var(--accent); }

:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

article :where(p, ul, ol) { margin-block: 1rem; }

article img, article svg { max-width: 100%; height: auto; }

pre {
  background: var(--code-bg);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.875rem;
}

:not(pre) > code {
  background: var(--code-bg);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.9em;
}

table { width: 100%; border-collapse: collapse; font-size: 0.9rem; display: block; overflow-x: auto; }
th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--rule); }

blockquote {
  margin-inline: 0;
  padding-left: 1rem;
  border-left: 3px solid var(--rule);
  color: var(--muted);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### `src/components/ThemeToggle.tsx`
```tsx
import { useEffect, useState } from 'preact/hooks';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  function apply(next: Theme) {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage can be blocked; the toggle still works for this page view */
    }
  }

  useEffect(() => {
    let stored: Theme | null = null;
    try {
      const raw = localStorage.getItem('theme');
      stored = raw === 'dark' || raw === 'light' ? raw : null;
    } catch {
      stored = null;
    }
    const initial: Theme =
      stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        apply(next);
      }}
      aria-label="Switch colour theme"
    >
      {theme === 'dark' ? 'light' : 'dark'}
    </button>
  );
}
```

### `src/layouts/Base.astro`
```astro
---
import '../styles/global.css';
import ThemeToggle from '../components/ThemeToggle';

interface Props {
  title: string;
  description?: string | undefined;
}

const { title, description = 'Notes on C++, databases and the Linux kernel.' } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="alternate" type="application/rss+xml" title="Mohammed Sohail" href="/rss.xml" />
    <link rel="sitemap" href="/sitemap-index.xml" />
  </head>
  <body>
    <header>
      <a href="/" class="home">msohail22</a>
      <nav>
        <a href="/rss.xml">rss</a>
        <ThemeToggle client:idle />
      </nav>
    </header>
    <main><slot /></main>
    <footer>
      <p>Mohammed Sohail &middot; <a href="https://github.com/msohail22">github</a></p>
    </footer>
  </body>
</html>
```

### `src/pages/index.astro`
```astro
---
import Base from '../layouts/Base.astro';
import { getCollection } from 'astro:content';

const posts = (await getCollection('blog', ({ data }) => data.blog === 'ready')).sort(
  (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
);
---

<Base title="Mohammed Sohail">
  <h1>Mohammed Sohail</h1>
  <p class="lede">
    I like building fast, low-level systems. Notes from ClickHouse, the Linux kernel and a homelab.
  </p>
  {
    posts.length === 0 ? (
      <p>No posts yet.</p>
    ) : (
      <ul class="posts">
        {posts.map((post) => (
          <li>
            <a href={`/blog/${post.id}/`}>{post.data.title}</a>
            <time datetime={post.data.date.toISOString()}>
              {post.data.date.toISOString().slice(0, 10)}
            </time>
          </li>
        ))}
      </ul>
    )
  }
</Base>
```

### `src/pages/blog/[...id].astro`
```astro
---
import Base from '../../layouts/Base.astro';
import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog', ({ data }) => data.blog === 'ready');
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
};

const { post } = Astro.props as { post: CollectionEntry<'blog'> };
const { Content } = await render(post);
---

<Base title={post.data.title} description={post.data.summary}>
  <article>
    <h1>{post.data.title}</h1>
    <p class="meta">
      <time datetime={post.data.date.toISOString()}>
        {post.data.date.toISOString().slice(0, 10)}
      </time>
      {post.data.source && (
        <>
          {' '}&middot; <a href={post.data.source}>source</a>
        </>
      )}
    </p>
    <Content />
  </article>
  <p><a href="/">&larr; all posts</a></p>
</Base>
```

### `src/pages/rss.xml.ts`
```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => data.blog === 'ready')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: 'Mohammed Sohail',
    description: 'Notes on C++, databases and the Linux kernel.',
    site: context.site!.toString(),
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary ?? '',
      link: `/blog/${post.id}/`,
    })),
  });
}
```

### `src/pages/404.astro`
```astro
---
import Base from '../layouts/Base.astro';
---

<Base title="Not found">
  <h1>Not found</h1>
  <p class="lede">That page does not exist.</p>
  <p><a href="/">&larr; all posts</a></p>
</Base>
```

**Verify:** `npm run build` and `npx astro check` both pass with zero errors.

## Task 3: GitHub Actions deploy workflow

### `.github/workflows/deploy.yml`
```yaml
name: Deploy site

on:
  push:
    branches: [master]
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out site
        uses: actions/checkout@v4

      - name: Check out notes content
        uses: actions/checkout@v4
        with:
          repository: msohail22/notes
          path: notes-content

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - run: npm ci
      - run: npm run build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Notes for the implementer: the second checkout needs no token because `msohail22/notes` is
public. The nightly cron picks up notes changes without any cross-repo credential.

**Verify:** the file is valid YAML (`python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))"`).
