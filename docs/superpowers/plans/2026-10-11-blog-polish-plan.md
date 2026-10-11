# Plan: blog UI polish

Repo: `/home/msohail22/Github/msohail22.github.io`, branch `master`.
Post file: `/home/msohail22/Github/notes/blog/2026-10-07-first-linux-kernel-patch.md`.

## Global Constraints

- Design language is copied from the user's own `low-level-lab` system: hairline 1px borders
  instead of shadows, square corners, **Spectral** for prose, **IBM Plex Mono** for code,
  numbers and UI labels, with tabular numerals. Index blue is the only accent. No shadows,
  no large radii, no gradients.
- Fonts load from Google Fonts only.
- Zero new dependencies. The copy button is plain DOM JavaScript in an Astro `<script>`.
  The theme toggle stays the single Preact island.
- Keep `npm run build` and `npm run check` passing.
- Use the file contents below verbatim.

## Task 1: Config — make code blocks follow the manual toggle

Currently Shiki bakes a light colour inline and only swaps on `prefers-color-scheme`, so the
site's own dark toggle leaves code blocks light. Setting `defaultColor: false` makes Shiki emit
`--shiki-light` / `--shiki-dark` custom properties instead, which CSS then selects.

### `astro.config.mjs` — replace the whole file
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
      defaultColor: false,
      wrap: true,
    },
  },
});
```

## Task 2: The theme toggle becomes a real switch

### `src/components/ThemeToggle.tsx` — replace the whole file
```tsx
import { useEffect, useState } from 'preact/hooks';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

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

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage can be blocked; the toggle still works for this page view */
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label="Dark mode"
      class="theme-switch"
      onClick={toggle}
    >
      <span class="theme-track" aria-hidden="true">
        <span class="theme-knob" />
      </span>
    </button>
  );
}
```

## Task 3: Layout — nav, fonts, copy buttons

### `src/layouts/Base.astro` — replace the whole file
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
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Spectral:ital,wght@0,400;0,600;1,400&display=swap"
    />
    <link rel="alternate" type="application/rss+xml" title="Mohammed Sohail" href="/rss.xml" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <script is:inline>
      // Set the theme before first paint so the page never flashes the wrong one.
      (function () {
        try {
          var stored = localStorage.getItem('theme');
          if (stored === 'dark' || stored === 'light') {
            document.documentElement.dataset.theme = stored;
            return;
          }
        } catch (e) {}
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.dataset.theme = 'dark';
        }
      })();
    </script>
  </head>
  <body>
    <header>
      <a href="/" class="home">msohail22</a>
      <nav>
        <a href="/rss.xml" class="nav-link">rss</a>
        <ThemeToggle client:idle />
      </nav>
    </header>
    <main><slot /></main>
    <footer>
      <p>Mohammed Sohail &middot; <a href="https://github.com/msohail22">github</a></p>
    </footer>

    <script>
      // Give every code block a language label and a copy button.
      document.querySelectorAll<HTMLPreElement>('pre.astro-code').forEach((pre) => {
        const parent = pre.parentNode;
        if (!parent) return;

        const wrap = document.createElement('div');
        wrap.className = 'code-wrap';
        parent.insertBefore(wrap, pre);

        const bar = document.createElement('div');
        bar.className = 'code-bar';

        const lang = document.createElement('span');
        lang.className = 'code-lang';
        lang.textContent = pre.dataset.language ?? 'text';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'code-copy';
        btn.textContent = 'copy';
        btn.addEventListener('click', () => {
          const code = pre.innerText;
          const done = (label: string) => {
            btn.textContent = label;
            window.setTimeout(() => {
              btn.textContent = 'copy';
            }, 1400);
          };
          navigator.clipboard.writeText(code).then(
            () => done('copied'),
            () => {
              // Clipboard can be refused; fall back to selecting the text.
              const range = document.createRange();
              range.selectNodeContents(pre);
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(range);
              done('selected');
            },
          );
        });

        bar.append(lang, btn);
        wrap.append(bar, pre);
      });
    </script>
  </body>
</html>
```

## Task 4: Remove the date from the post header

### `src/pages/blog/[...id].astro` — replace the whole file
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
    {post.data.source && (
      <p class="meta"><a href={post.data.source}>source</a></p>
    )}
    <Content />
  </article>
  <p class="back"><a href="/">&larr; all posts</a></p>
</Base>
```

The index page keeps its dates — only the post header loses one.

## Task 5: The stylesheet

### `src/styles/global.css` — replace the whole file
```css
/* Tokens. Same language as low-level-lab: paper and ink, hairline rules,
   index blue as the only accent. */
:root {
  --paper: #fdfdfb;
  --paper-sunk: #f5f4f0;
  --ink: #1b1b19;
  --ink-muted: #6e6c66;
  --rule: #ddd9d1;
  --index-blue: #1a52c4;
  --marker-gold: #a8791b;
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --paper: #131312;
    --paper-sunk: #1c1c1a;
    --ink: #e9e7e1;
    --ink-muted: #96938b;
    --rule: #302e2a;
    --index-blue: #7fa6f5;
    --marker-gold: #d2a850;
    color-scheme: dark;
  }
}

:root[data-theme='dark'] {
  --paper: #131312;
  --paper-sunk: #1c1c1a;
  --ink: #e9e7e1;
  --ink-muted: #96938b;
  --rule: #302e2a;
  --index-blue: #7fa6f5;
  --marker-gold: #d2a850;
  color-scheme: dark;
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  padding-inline: 16px;
  background: var(--paper);
  color: var(--ink);
  font-family: Spectral, Georgia, 'Times New Roman', serif;
  font-size: 1.0625rem;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

header, main, footer { max-width: 40rem; margin-inline: auto; }

/* ---------- header ---------- */

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-block: 1.25rem;
  border-bottom: 1px solid var(--rule);
}

.home {
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-decoration: none;
  color: var(--ink);
}

.home::before { content: '/'; color: var(--marker-gold); margin-right: 0.15rem; }

header nav { display: flex; align-items: center; gap: 1rem; }

.nav-link {
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--ink-muted);
}

.nav-link:hover { color: var(--index-blue); }

/* ---------- theme switch ---------- */

.theme-switch {
  display: block;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  line-height: 0;
}

.theme-track {
  display: block;
  position: relative;
  width: 34px;
  height: 18px;
  border: 1px solid var(--rule);
  background: var(--paper-sunk);
  transition: border-color 0.15s ease;
}

.theme-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  background: var(--ink-muted);
  transition: transform 0.18s ease, background 0.18s ease;
}

.theme-switch[aria-checked='true'] .theme-knob {
  transform: translateX(16px);
  background: var(--marker-gold);
}

.theme-switch:hover .theme-track { border-color: var(--index-blue); }

/* ---------- main ---------- */

main { padding-block: 3rem 4rem; }

footer {
  padding-block: 1.5rem;
  border-top: 1px solid var(--rule);
  color: var(--ink-muted);
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
}

footer p { margin: 0; }

a { color: var(--index-blue); text-underline-offset: 2px; }

h1 {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.015em;
  text-wrap: balance;
  margin-block: 0 0.75rem;
}

h2 {
  font-size: 1.3125rem;
  font-weight: 600;
  line-height: 1.3;
  text-wrap: balance;
  margin-block: 3rem 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--rule);
}

h3 { font-size: 1.0625rem; font-weight: 600; margin-block: 2rem 0.5rem; }

.lede {
  color: var(--ink-muted);
  font-size: 1.125rem;
  margin-block: 0 2.5rem;
}

.meta {
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-block: 0 2.5rem;
}

.back {
  margin-top: 4rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--rule);
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8125rem;
}

/* ---------- post index ---------- */

.posts { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--rule); }

.posts li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1.5rem;
  padding-block: 1rem;
  border-bottom: 1px solid var(--rule);
}

.posts a { text-decoration: none; font-size: 1.0625rem; }
.posts a:hover { text-decoration: underline; }

.posts time {
  flex: none;
  color: var(--ink-muted);
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

/* ---------- body copy ---------- */

article :where(p, ul, ol) { margin-block: 1.25rem; }
article :where(ul, ol) { padding-left: 1.25rem; }
article li { margin-block: 0.35rem; }
article img, article svg { max-width: 100%; height: auto; }
article figure { margin: 2.5rem 0; text-align: center; }

blockquote {
  margin-inline: 0;
  padding-left: 1.25rem;
  border-left: 2px solid var(--marker-gold);
  color: var(--ink-muted);
  font-style: italic;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  display: block;
  overflow-x: auto;
  margin-block: 1.5rem;
}

th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--rule); }

th {
  font-weight: 500;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
  border-bottom-color: var(--ink-muted);
}

/* ---------- code ---------- */

:not(pre) > code {
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
  background: var(--paper-sunk);
  border: 1px solid var(--rule);
  padding: 0.05em 0.3em;
  white-space: nowrap;
}

.code-wrap { margin-block: 1.5rem; border: 1px solid var(--rule); background: var(--paper-sunk); }

.code-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0.6rem;
  border-bottom: 1px solid var(--rule);
}

.code-lang, .code-copy {
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.code-lang { color: var(--ink-muted); }

.code-copy {
  border: 1px solid transparent;
  background: none;
  color: var(--ink-muted);
  padding: 0.1rem 0.4rem;
  cursor: pointer;
}

.code-copy:hover { color: var(--index-blue); border-color: var(--rule); }

pre.astro-code {
  margin: 0;
  padding: 0.85rem;
  overflow-x: auto;
  background: transparent !important;
  font-size: 0.8125rem;
  line-height: 1.6;
}

pre.astro-code code {
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Shiki emits both palettes as custom properties; pick one per theme so the
   site's own toggle controls code colour, not just the OS setting. */
.astro-code, .astro-code span {
  color: var(--shiki-light);
  font-style: var(--shiki-light-font-style);
  font-weight: var(--shiki-light-font-weight);
  text-decoration: var(--shiki-light-text-decoration);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .astro-code,
  :root:not([data-theme='light']) .astro-code span {
    color: var(--shiki-dark);
    font-style: var(--shiki-dark-font-style);
    font-weight: var(--shiki-dark-font-weight);
    text-decoration: var(--shiki-dark-text-decoration);
  }
}

:root[data-theme='dark'] .astro-code,
:root[data-theme='dark'] .astro-code span {
  color: var(--shiki-dark);
  font-style: var(--shiki-dark-font-style);
  font-weight: var(--shiki-dark-font-weight);
  text-decoration: var(--shiki-dark-text-decoration);
}

/* ---------- misc ---------- */

:focus-visible { outline: 2px solid var(--index-blue); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (max-width: 30rem) {
  body { font-size: 1rem; }
  h1 { font-size: 1.625rem; }
  .posts li { flex-direction: column; gap: 0.2rem; }
}
```

## Task 6: Edit the post

File: `/home/msohail22/Github/notes/blog/2026-10-07-first-linux-kernel-patch.md`

Delete the final section entirely — the `## What I would tell myself` heading and the
paragraph under it. The file must then end after the `Result: 250` paragraph. Change nothing
else in that file, and do not touch any other file in that repository.

## Verification

1. `npm run build` exits 0.
2. `npm run check` exits 0.
3. `grep -c "code-wrap\|code-copy" dist/blog/*/index.html` — the script is inlined, so confirm
   instead that `dist/_astro/` contains a script bundle and that `npm run build` printed no errors.
4. `grep -c "What I would tell myself" dist/blog/*/index.html` returns 0.
5. `grep -o 'shiki-dark' dist/blog/*/index.html | head -1` is non-empty (dual palette emitted).
6. `grep -c "2026-10-07" dist/blog/*/index.html` returns 0 for the meta line (the date may still
   appear in the post body text; check the `<p class="meta">` block specifically does not contain it).
