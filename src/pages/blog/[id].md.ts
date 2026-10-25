import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIContext, GetStaticPaths } from 'astro';

// The llms.txt convention: the same page with `.md` appended, serving the raw
// Markdown instead of the rendered HTML. Linked from each post's <head> as
// rel="alternate" type="text/markdown".
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog', ({ data }) => data.blog === 'ready');
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
};

export async function GET(context: APIContext) {
  const { post } = context.props as { post: CollectionEntry<'blog'> };
  const site = context.site!.toString().replace(/\/$/, '');

  const front = [
    '---',
    `title: ${JSON.stringify(post.data.title)}`,
    `date: ${post.data.date.toISOString().slice(0, 10)}`,
    `topic: ${post.data.topic}`,
    ...(post.data.tags.length ? [`tags: [${post.data.tags.join(', ')}]`] : []),
    ...(post.data.source ? [`source: ${post.data.source}`] : []),
    ...(post.data.summary ? [`summary: ${JSON.stringify(post.data.summary)}`] : []),
    `canonical: ${site}/blog/${post.id}/`,
    '---',
    '',
  ];

  return new Response(front.join('\n') + '\n' + (post.body ?? '').trim() + '\n', {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
