// SPDX-License-Identifier: Apache-2.0
import { type ContentSource, createContentSource, type ForgeConfig } from '@docforge/core';
import { CONTENT_MODEL, type ContentModel } from '@docforge/schema';
import { draftNotReviewedRules } from './rules/draft-not-reviewed.js';
import { footnoteRules } from './rules/footnotes.js';
import { frontmatterRules } from './rules/frontmatter.js';
import { freshnessRules } from './rules/freshness.js';
import { linkRules } from './rules/links.js';
import { provenanceRules } from './rules/provenance.js';
import { reachabilityRules } from './rules/reachability.js';
import type { Diagnostic, GateContext, GateResult, Rule } from './types.js';

/** The full set of gate rules, in report order. */
export const ALL_RULES: Rule[] = [
  frontmatterRules,
  freshnessRules,
  footnoteRules,
  linkRules,
  reachabilityRules,
  provenanceRules,
  draftNotReviewedRules,
];

export interface GateOptions {
  /** Override "today" (UTC). Defaults to the current date. */
  today?: Date;
  /** Override the content model. Defaults to the bundled SSOT. */
  model?: ContentModel;
}

function toISODateUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function createGateContext(source: ContentSource, opts: GateOptions = {}): GateContext {
  return {
    pages: source.pages,
    config: source.config,
    model: opts.model ?? CONTENT_MODEL,
    today: toISODateUTC(opts.today ?? new Date()),
  };
}

/** Run a set of rules over a context and aggregate diagnostics. */
export function runGates(ctx: GateContext, rules: Rule[] = ALL_RULES): GateResult {
  const diagnostics = rules
    .flatMap((rule) => rule(ctx))
    .sort((a, b) => a.path.localeCompare(b.path) || a.rule.localeCompare(b.rule));
  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
  return { diagnostics, errorCount, warningCount, ok: errorCount === 0 };
}

/** Convenience: load a repo's content and run all gates against it. */
export async function checkContent(
  rootDir: string,
  opts: GateOptions & { config?: ForgeConfig } = {},
): Promise<GateResult> {
  const source = await createContentSource(rootDir, opts.config);
  return runGates(createGateContext(source, opts));
}
