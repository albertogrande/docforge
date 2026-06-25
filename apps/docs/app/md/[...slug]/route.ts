// SPDX-License-Identifier: Apache-2.0
import { getSource, slugToPath } from '@/lib/source';

export async function generateStaticParams() {
  const source = await getSource();
  return source.pages.map((p) => ({ slug: p.path.split('/') }));
}

/**
 * The `.md` route: serves the canonical Markdown verbatim, byte-identical to the
 * MCP `get_page` tool — both go through `renderMarkdown`. This is the parity the
 * adapter conformance suite guards.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const source = await getSource();
  const page = source.getPage(slugToPath(slug));
  if (!page) return new Response('Not found', { status: 404 });
  return new Response(source.renderMarkdown(page), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
}
