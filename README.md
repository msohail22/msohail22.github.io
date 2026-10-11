# msohail22.github.io

My blog, at <https://msohail22.github.io>.

Astro 7 + Preact + TypeScript. Zero JavaScript on every page except one Preact island
(the theme toggle).

## Where the content lives

Posts are **not** in this repo. They live in [msohail22/notes](https://github.com/msohail22/notes),
under `blog/`, and only notes whose frontmatter says `blog: ready` are published.

```
msohail22/notes            this repo
  blog/post.md    ──────>  reads notes-content/blog/
    blog: ready            builds, deploys to Pages
```

`notes-content` is a checkout of the notes repo in CI, and a symlink locally. It is
git-ignored, so content is never copied or duplicated. One source of truth.

## Local development

```sh
npm install
ln -sfn ../notes notes-content    # expects msohail22/notes as a sibling directory
npm run dev
```

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run check` | Type-check with `tsc --noEmit` |

`npm run check` uses `tsc` directly rather than `astro check`, because `@astrojs/check`
tops out at 0.9.10 and does not support Astro 7 yet. Switch it back once it does.

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to
`master`, once nightly at 06:00 UTC, and on manual dispatch. The nightly run is what
picks up new posts from the notes repo, since nothing notifies this repo when that one
changes. Trigger it by hand from the Actions tab for an immediate publish.

## Routes

- `/` — post index
- `/blog/<slug>/` — a post
- `/rss.xml` — feed
- `/sitemap-index.xml` — sitemap
- `/404.html`
