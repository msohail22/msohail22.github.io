import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

// Not part of the llms.txt spec, but the established companion convention: every
// post's Markdown in one file, so an agent needs a single fetch.
export async function GET(context: APIContext) {
  const site = context.site!.toString().replace(/\/$/, '');
  const posts = (await getCollection('blog', ({ data }) => data.blog === 'ready')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const parts = [
    '# Mohammed Sohail — full text',
    '',
    '> Every published post, newest first. Generated; do not edit.',
    '',
  ];

  for (const post of posts) {
    parts.push(
      '---',
      '',
      `# ${post.data.title}`,
      '',
      `- URL: ${site}/blog/${post.id}/`,
      `- Date: ${post.data.date.toISOString().slice(0, 10)}`,
      `- Topic: ${post.data.topic}`,
      ...(post.data.tags.length ? [`- Tags: ${post.data.tags.join(', ')}`] : []),
      ...(post.data.source ? [`- Source: ${post.data.source}`] : []),
      '',
      (post.body ?? '').trim(),
      '',
    );
  }

  return new Response(parts.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
