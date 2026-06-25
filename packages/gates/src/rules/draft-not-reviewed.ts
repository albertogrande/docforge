// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic, GateContext } from '../types.js';

/**
 * The platform invariant, enforced structurally: a page may not be `reviewed`
 * unless its provenance carries evidence of a human approval — a `reviewed_by`
 * record AND a `reviewed` transition that references the approving PR. An agent
 * hand-setting `status: reviewed` cannot fabricate that evidence, so this gate
 * fails the PR. Promotion is only ever performed by the approval-triggered
 * Action (`forge approve`).
 */
export function draftNotReviewedRules(ctx: GateContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const page of ctx.pages) {
    if (page.status !== 'reviewed') continue;
    const prov = page.provenance;

    if (!prov?.reviewed_by) {
      out.push({
        rule: 'draft-pages-not-reviewed',
        severity: 'error',
        path: page.path,
        message:
          'status=reviewed without recorded human approval (provenance.reviewed_by) — ' +
          'agents may not self-promote; promotion happens on PR approval',
      });
    }
    if (!prov?.transitions.some((t) => t.to === 'reviewed' && t.pr != null)) {
      out.push({
        rule: 'draft-pages-not-reviewed',
        severity: 'error',
        path: page.path,
        message: 'status=reviewed requires a `reviewed` transition referencing the approving PR',
      });
    }
  }
  return out;
}
