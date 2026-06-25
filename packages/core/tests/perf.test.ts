// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createContentSource } from '../src/index.js';

const roots: string[] = [];
function corpus(n: number): string {
  const root = mkdtempSync(join(tmpdir(), 'nema-perf-'));
  roots.push(root);
  const docs = join(root, 'docs');
  mkdirSync(docs, { recursive: true });
  writeFileSync(
    join(docs, 'index.md'),
    '---\ntitle: Home\nstatus: draft\n---\n\n# Home\n\nwidgets and gizmos overview\n',
  );
  for (let i = 0; i < n; i++) {
    writeFileSync(
      join(docs, `page-${i}.md`),
      `---\ntitle: Page ${i}\nstatus: draft\n---\n\n# Page ${i}\n\nlorem ipsum dolor sit amet widgets gizmos number ${i}\n`,
    );
  }
  return root;
}
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

describe('content source caching at scale', () => {
  it('reuses the parsed corpus across loads, and the cached load is far cheaper', async () => {
    const root = corpus(500);

    const t0 = performance.now();
    const first = await createContentSource(root);
    const firstMs = performance.now() - t0;
    expect(first.pages.length).toBe(501);

    const t1 = performance.now();
    const second = await createContentSource(root);
    const cachedMs = performance.now() - t1;

    expect(second).toBe(first); // identical object — no re-parse
    expect(cachedMs).toBeLessThan(firstMs);
  });

  it('invalidates automatically when the corpus changes', async () => {
    const root = corpus(20);
    const before = await createContentSource(root);
    writeFileSync(
      join(root, 'docs', 'new.md'),
      '---\ntitle: New\nstatus: draft\n---\n\n# New\n\nfresh body\n',
    );
    const after = await createContentSource(root);
    expect(after).not.toBe(before);
    expect(after.pages.length).toBe(before.pages.length + 1);
  });

  it('memoizes the search index within a source (repeat queries stay stable)', async () => {
    const src = await createContentSource(corpus(50));
    const widgets = src.search('widgets', 5);
    expect(widgets.length).toBeGreaterThan(0);
    expect(src.search('gizmos', 5).length).toBeGreaterThan(0);
    expect(src.search('widgets', 5)).toEqual(widgets);
  });
});
