// SPDX-License-Identifier: Apache-2.0
import { nearDuplicates } from '@getnema/core';
import type { Diagnostic, GateContext } from '../types.js';

/**
 * Near-duplicate detection: warn when two pages share so much distinctive
 * vocabulary (TF-IDF cosine ≥ threshold) that one is likely a duplicate of the
 * other. This is the "writes a page that *fits*" guardrail — an agent that
 * re-documents an existing topic instead of updating the page is the classic
 * failure of context-free authoring.
 *
 * A **warning**, never an error: high similarity is a strong signal, not proof
 * (a reference and its tutorial can legitimately overlap). The threshold is set
 * high for precision — real corpora of distinct pages sit well below it.
 */
const DUPLICATE_THRESHOLD = 0.6;

export function nearDuplicateRules(ctx: GateContext): Diagnostic[] {
  return nearDuplicates(ctx.pages, DUPLICATE_THRESHOLD).map((d) => ({
    rule: 'near-duplicate',
    severity: 'warning' as const,
    path: d.a,
    message: `near-duplicate of "${d.b}" (similarity ${d.score.toFixed(2)}) — update that page or differentiate this one`,
  }));
}
