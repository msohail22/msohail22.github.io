import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

// The plain-text sitemap format Google also accepts: one absolute URL per line,
// nothing else. @astrojs/sitemap already emits the XML version.
export async function GET(context: APIContext) {
  const site = context.site!.toString().replace(/\/$/, '');
  const posts = (await getCollection('blog', ({ data }) => data.blog === 'ready')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const urls = [`${site}/`, `${site}/blog/`, ...posts.map((post) => `${site}/blog/${post.id}/`)];

  return new Response(urls.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
