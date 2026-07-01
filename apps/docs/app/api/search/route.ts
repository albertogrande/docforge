// SPDX-License-Identifier: Apache-2.0
import type { SortedResult } from 'fumadocs-core/search';
import { getSource } from '@/lib/source';

export const dynamic = 'force-dynamic';

function docUrl(path: string): string {
  return path === 'index' ? '/docs' : `/docs/${path}`;
}

/**
 * Reader-facing search: serves the Nema BM25 index (the same one the MCP
 * `search` tool uses) in the shape Fumadocs' default search dialog expects, so
 * the `Cmd/Ctrl+K` UI is backed by our engine rather than a duplicate index.
 */
export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams.get('query')?.trim() ?? '';
  if (!query) {
    return new Response('[]', { headers: { 'content-type': 'application/json; charset=utf-8' } });
  }

  const source = await getSource();
  const results: SortedResult[] = [];
  for (const hit of source.search(query, 12)) {
    const url = hit.anchor ? `${docUrl(hit.path)}#${hit.anchor}` : docUrl(hit.path);
    results.push({ id: hit.path, url, type: 'page', content: hit.title });
    if (hit.snippet) {
      results.push({ id: `${hit.path}#snippet`, url, type: 'text', content: hit.snippet });
    }
  }
  return new Response(JSON.stringify(results), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
