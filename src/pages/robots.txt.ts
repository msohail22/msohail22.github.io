import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const site = context.site!.toString().replace(/\/$/, '');

  // Everything here is public and meant to be read, including by crawlers and
  // model trainers. Nothing is disallowed, so nothing needs a per-agent rule.
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${site}/sitemap-index.xml`,
    `Sitemap: ${site}/sitemap.txt`,
    '',
    `# Markdown index for language models: ${site}/llms.txt`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
