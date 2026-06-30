// SPDX-License-Identifier: Apache-2.0
import type { Page, ResolvedConfig } from '@getnema/core';
import { describe, expect, it } from 'vitest';
import { createGateContext, runGates } from '../src/index.js';
import { nearDuplicateRules } from '../src/rules/near-duplicate.js';

function page(path: string, title: string, body: string): Page {
  return { path, filePath: `${path}.md`, title, status: 'draft', frontmatter: {}, body };
}

function ctxFor(pages: Page[]) {
  const config = {
    rootDir: '/r',
    contentDir: 'docs',
    contentRoot: '/r/docs',
    codeRoot: '/r',
    reviewSlaDays: 180,
    rootExempt: ['index'],
    baseUrl: '',
  } as ResolvedConfig;
  return createGateContext({
    pages,
    config,
    getPage: () => null,
    search: () => [],
    renderMarkdown: () => '',
    nav: [],
    provenanceOf: () => null,
  });
}

describe('near-duplicate gate', () => {
  it('warns on a near-duplicate pair, never errors', () => {
    const body = 'Install the nema CLI with npm and run nema check to validate your docs.';
    const diags = nearDuplicateRules(
      ctxFor([
        page('install', 'Install', body),
        page('setup', 'Set up', `${body} It is quick.`),
        page('trust', 'Trust', 'The trust route renders provenance for each reviewed page.'),
      ]),
    );
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags.every((d) => d.severity === 'warning')).toBe(true);
    expect(diags.every((d) => d.rule === 'near-duplicate')).toBe(true);
    // the distinct page is never one side of a flagged pair
    expect(diags.some((d) => d.message.includes('trust'))).toBe(false);
  });

  it('stays silent on a corpus of distinct pages, and never fails the build', () => {
    const result = runGates(
      ctxFor([
        page('a', 'Alpha', 'apples bananas cherries orchard harvest'),
        page('b', 'Beta', 'turbines pistons crankshaft engine torque'),
      ]),
    );
    expect(result.diagnostics.filter((d) => d.rule === 'near-duplicate')).toEqual([]);
  });
});
