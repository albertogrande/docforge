// SPDX-License-Identifier: Apache-2.0
import { stripCode } from '../markdown.js';
import type { Diagnostic, GateContext } from '../types.js';

const FN_DEF_RE = /^\[\^([^\]]+)\]:/gm;
const FN_REF_RE = /\[\^([^\]]+)\](?!:)/g;
const SOURCES_HEADING_RE = /^#{2,}\s+Sources\b/m;

/**
 * Footnote integrity + citation discipline:
 *   - every referenced footnote must be defined, and vice versa;
 *   - if a page uses footnotes it must carry a `## Sources` section.
 * Code spans are stripped so example syntax isn't mistaken for real footnotes.
 */
export function footnoteRules(ctx: GateContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const page of ctx.pages) {
    const stripped = stripCode(page.body);
    const defs = new Set([...page.body.matchAll(FN_DEF_RE)].map((m) => m[1]!));
    const refs = new Set([...stripped.matchAll(FN_REF_RE)].map((m) => m[1]!));

    for (const id of [...refs].filter((r) => !defs.has(r)).sort()) {
      out.push({
        rule: 'footnotes',
        severity: 'error',
        path: page.path,
        message: `footnote [^${id}] referenced but never defined`,
      });
    }
    for (const id of [...defs].filter((d) => !refs.has(d)).sort()) {
      out.push({
        rule: 'footnotes',
        severity: 'error',
        path: page.path,
        message: `footnote [^${id}] defined but never referenced`,
      });
    }
    if (defs.size > 0 && !SOURCES_HEADING_RE.test(page.body)) {
      out.push({
        rule: 'citations',
        severity: 'error',
        path: page.path,
        message: "uses footnotes but has no '## Sources' section",
      });
    }
  }
  return out;
}
