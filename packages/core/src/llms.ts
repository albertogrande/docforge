// SPDX-License-Identifier: Apache-2.0
import { navPaths } from './nav.js';
import { renderMarkdown } from './render.js';
import type { ContentSource, Page } from './types.js';

export interface LlmsOptions {
  /** Document title (H1). Default 'Documentation'. */
  title?: string;
  /** Optional one-line summary rendered as a blockquote. */
  description?: string;
  /** Base URL for absolute links. Defaults to the source's configured baseUrl. */
  baseUrl?: string;
}

/** Pages in nav order, with any pages missing from the nav appended. */
function orderedPages(source: ContentSource): Page[] {
  const byPath = new Map(source.pages.map((p) => [p.path, p]));
  const ordered: Page[] = [];
  const seen = new Set<string>();
  for (const path of navPaths(source.nav)) {
    const page = byPath.get(path);
    if (page && !seen.has(path)) {
      ordered.push(page);
      seen.add(path);
    }
  }
  for (const page of source.pages) {
    if (!seen.has(page.path)) ordered.push(page);
  }
  return ordered;
}

function trimBase(baseUrl: string | undefined): string {
  return (baseUrl ?? '').replace(/\/+$/, '');
}

/**
 * Build an `llms.txt` index (llmstxt.org convention): a titled list of every
 * page linking to its canonical `.md` URL, annotated with status + author so an
 * agent can see what to trust before fetching.
 */
export function buildLlmsIndex(source: ContentSource, opts: LlmsOptions = {}): string {
  const base = trimBase(opts.baseUrl ?? source.config.baseUrl);
  const out: string[] = [`# ${opts.title ?? 'Documentation'}`, ''];
  if (opts.description) out.push(`> ${opts.description}`, '');
  out.push('## Docs', '');
  for (const page of orderedPages(source)) {
    const prov = source.provenanceOf(page.path);
    const author = prov?.authored_by ?? 'unknown';
    const review = prov?.reviewed_by
      ? `reviewed by @${prov.reviewed_by.login}`
      : 'not yet reviewed';
    out.push(
      `- [${page.title}](${base}/md/${page.path}): ${page.status}; authored by ${author}; ${review}`,
    );
  }
  return `${out.join('\n')}\n`;
}

/**
 * Build `llms-full.txt`: the entire corpus concatenated, each page front-stamped
 * with a provenance comment so a single fetch gives an agent every page and the
 * trust metadata behind it.
 */
export function buildLlmsFull(source: ContentSource, opts: LlmsOptions = {}): string {
  const out: string[] = [`# ${opts.title ?? 'Documentation'}`, ''];
  if (opts.description) out.push(`> ${opts.description}`, '');
  for (const page of orderedPages(source)) {
    const prov = source.provenanceOf(page.path);
    const stamp = [
      `path: ${page.path}`,
      `status: ${page.status}`,
      `authored_by: ${prov?.authored_by ?? 'unknown'}`,
      ...(prov?.model?.name ? [`model: ${prov.model.name}`] : []),
      ...(prov?.reviewed_by ? [`reviewed_by: ${prov.reviewed_by.login}`] : []),
    ].join(' | ');
    out.push('', '---', '', `<!-- ${stamp} -->`, '', renderMarkdown(page));
  }
  return `${out.join('\n')}\n`;
}
