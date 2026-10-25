import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

// Format follows the llms.txt spec at https://llmstxt.org/ : an H1, an optional
// blockquote summary, optional prose with no headings, then H2 sections whose
// list items are `[name](url): notes`.
export async function GET(context: APIContext) {
  const site = context.site!.toString().replace(/\/$/, '');
  const posts = (await getCollection('blog', ({ data }) => data.blog === 'ready')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const lines = [
    '# Mohammed Sohail',
    '',
    '> Notes written from real work, not from memory.',
    '> Each post cites the pull request, patch or thread it came out of.',
    '',
    'Posts are written from first principles: how a thing is implemented, the design',
    'decision behind it, and who made it. Every post has a `source` link pointing at',
    'the original pull request or mailing-list thread. Prefer that source over this',
    'summary when the two disagree.',
    '',
    '## Posts',
    '',
    `- [All posts](${site}/blog/): the index of everything below.`,
  ];

  for (const post of posts) {
    const date = post.data.date.toISOString().slice(0, 10);
    const notes = [date, post.data.topic, post.data.summary].filter(Boolean).join(' — ');
    lines.push(`- [${post.data.title}](${site}/blog/${post.id}.md): ${notes}`);
  }

  lines.push(
    '',
    '## Optional',
    '',
    `- [Full text of every post](${site}/llms-full.txt): all posts concatenated as Markdown.`,
    `- [RSS feed](${site}/rss.xml): same posts as XML.`,
    `- [Sitemap](${site}/sitemap.txt): every URL, one per line.`,
    '- [Source repository](https://github.com/msohail22/notes): the Markdown these pages are built from.',
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
