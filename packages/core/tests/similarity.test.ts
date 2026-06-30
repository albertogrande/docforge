// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { findSimilar, findSimilarToText, nearDuplicates } from '../src/similarity.js';
import type { Page } from '../src/types.js';

function page(path: string, title: string, body: string): Page {
  return { path, filePath: `${path}.md`, title, status: 'draft', frontmatter: {}, body };
}

const corpus: Page[] = [
  page(
    'install',
    'Install the CLI',
    'Install the nema CLI with npm and run nema check to validate.',
  ),
  page(
    'setup',
    'Set up the CLI',
    'Set up the nema CLI: install it with npm, then run nema check to validate your docs.',
  ),
  page(
    'trust',
    'Trust dashboard',
    'The trust route renders provenance: who authored and reviewed each page.',
  ),
];

describe('findSimilar', () => {
  it('ranks the near-duplicate page first', () => {
    const hits = findSimilar(corpus, 'install');
    expect(hits[0]?.path).toBe('setup'); // install ≈ setup, not trust
    expect(hits[0]!.score).toBeGreaterThan(hits.at(-1)!.score);
  });

  it('returns nothing for an unknown path', () => {
    expect(findSimilar(corpus, 'nope')).toEqual([]);
  });

  it('a topically distinct page scores low against the others', () => {
    const hits = findSimilar(corpus, 'trust', { minScore: 0.5 });
    expect(hits).toEqual([]); // trust shares little vocabulary with install/setup
  });
});

describe('findSimilarToText', () => {
  it('finds the existing page a draft would duplicate', () => {
    const hits = findSimilarToText(corpus, {
      title: 'Installing the CLI',
      body: 'How to install the nema CLI via npm and run nema check.',
    });
    expect(['install', 'setup']).toContain(hits[0]?.path);
  });
});

describe('nearDuplicates', () => {
  it('flags the install/setup pair above a threshold but not the distinct page', () => {
    const dups = nearDuplicates(corpus, 0.5);
    expect(dups).toHaveLength(1);
    expect([dups[0]?.a, dups[0]?.b].sort()).toEqual(['install', 'setup']);
  });

  it('an empty/low threshold corpus of distinct pages yields no pairs', () => {
    const distinct = [
      page('a', 'Alpha', 'apples bananas cherries'),
      page('b', 'Beta', 'engines turbines pistons'),
    ];
    expect(nearDuplicates(distinct, 0.5)).toEqual([]);
  });
});
