// SPDX-License-Identifier: Apache-2.0
import { extractLinks } from '../markdown.js';
import { resolveLinkTarget } from './links.js';
import type { Diagnostic, GateContext } from '../types.js';

const EXTERNAL_RE = /^(https?:|mailto:|tel:|ftp:)/i;

/**
 * Reachability: every non-exempt leaf page must be the target of at least one
 * internal link. Entry points are exempt: the configured `rootExempt` paths and
 * any root `index` or per-directory section-landing index page.
 */
export function reachabilityRules(ctx: GateContext): Diagnostic[] {
  const linked = new Set<string>();
  for (const page of ctx.pages) {
    for (const raw of extractLinks(page.body)) {
      const link = raw.trim();
      if (!link || EXTERNAL_RE.test(link) || link.startsWith('#')) continue;
      const targetPath = link.split('#')[0]!;
      if (!targetPath) continue;
      const target = resolveLinkTarget(page, targetPath, ctx);
      if (target) linked.add(target.path);
    }
  }

  const exempt = new Set(ctx.config.rootExempt);
  const out: Diagnostic[] = [];
  for (const page of ctx.pages) {
    const isEntryPoint =
      exempt.has(page.path) || page.path === 'index' || page.path.endsWith('/index');
    if (!isEntryPoint && !linked.has(page.path)) {
      out.push({
        rule: 'reachability',
        severity: 'error',
        path: page.path,
        message: 'orphan — not linked from any other page',
      });
    }
  }
  return out;
}
