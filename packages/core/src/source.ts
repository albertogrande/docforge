// SPDX-License-Identifier: Apache-2.0
import { statSync } from 'node:fs';
import { resolveConfig } from './config.js';
import { findPage, loadPages, walkMarkdown } from './load.js';
import { buildNav } from './nav.js';
import { renderMarkdown } from './render.js';
import { type SearchIndex, buildSearchIndex, searchIndex } from './search.js';
import type { ContentSource, NemaConfig, ResolvedConfig } from './types.js';

/** A cheap corpus fingerprint — page count + total size + newest mtime. */
function corpusSignature(contentRoot: string): string {
  let count = 0;
  let totalSize = 0;
  let maxMtime = 0;
  for (const file of walkMarkdown(contentRoot)) {
    const s = statSync(file);
    count += 1;
    totalSize += s.size;
    if (s.mtimeMs > maxMtime) maxMtime = s.mtimeMs;
  }
  return `${count}:${totalSize}:${maxMtime}`;
}

/** Cache key over the config fields that change what a ContentSource exposes. */
function cacheKey(config: ResolvedConfig): string {
  return JSON.stringify({
    contentRoot: config.contentRoot,
    baseUrl: config.baseUrl,
    rootExempt: config.rootExempt,
    reviewSlaDays: config.reviewSlaDays,
    contentModel: config.contentModel ?? null,
  });
}

const sourceCache = new Map<string, { signature: string; source: ContentSource }>();

function buildSource(config: ResolvedConfig): ContentSource {
  const pages = loadPages(config.contentRoot);
  const nav = config.nav
    ? typeof config.nav === 'function'
      ? config.nav(pages)
      : config.nav
    : buildNav(pages);

  // The BM25 index is the expensive part of search; build it lazily on first use
  // and reuse it for the life of this (cached) source.
  let index: SearchIndex | null = null;

  return {
    pages,
    nav,
    config,
    getPage: (path) => findPage(pages, path),
    search: (query, limit) => {
      index ??= buildSearchIndex(pages);
      return searchIndex(index, query, limit);
    },
    renderMarkdown,
    provenanceOf: (path) => findPage(pages, path)?.provenance ?? null,
  };
}

/**
 * Build a `ContentSource` from an already-resolved config. Cached by config + a
 * corpus mtime/size signature: repeated loads of an unchanged corpus reuse the
 * parsed pages and search index, while any file change invalidates the entry
 * automatically (so reads see writes). A custom `nav` function opts out of the
 * cache, since functions can't be compared by value.
 */
export function contentSourceFromConfig(config: ResolvedConfig): ContentSource {
  if (typeof config.nav === 'function') return buildSource(config);

  const key = cacheKey(config);
  const signature = corpusSignature(config.contentRoot);
  const cached = sourceCache.get(key);
  if (cached && cached.signature === signature) return cached.source;

  const source = buildSource(config);
  sourceCache.set(key, { signature, source });
  return source;
}

/**
 * Load a `ContentSource` for a repo: resolve config (incl. `nema.config.*`),
 * then load and index every page. This is the main entry point for adapters,
 * the MCP server, and the CLI.
 */
export async function createContentSource(
  rootDir: string,
  overrides?: NemaConfig,
): Promise<ContentSource> {
  const config = await resolveConfig(rootDir, overrides);
  return contentSourceFromConfig(config);
}
