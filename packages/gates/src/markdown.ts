// SPDX-License-Identifier: Apache-2.0

const FENCE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`]*`/g;

/** Strip fenced and inline code so literal `[^id]` or `](...)` in examples is ignored. */
export function stripCode(text: string): string {
  return text.replace(FENCE_RE, '').replace(INLINE_CODE_RE, '');
}

const LINK_RE = /\]\(([^)]+)\)/g;

/** Extract Markdown link targets (the `(...)` of `[text](...)`), code stripped. */
export function extractLinks(body: string): string[] {
  const out: string[] = [];
  for (const m of stripCode(body).matchAll(LINK_RE)) out.push(m[1]!.trim());
  return out;
}
