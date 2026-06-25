// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { scaffold } from '../src/scaffold.js';
import { templates } from '../src/templates.js';

const roots: string[] = [];
function newDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'create-docforge-'));
  roots.push(d);
  return d;
}
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

describe('templates', () => {
  it('emits the producer-loop files with the project name', () => {
    const files = templates({ name: 'my-docs' });
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        'docforge.config.ts',
        'docs/index.md',
        'package.json',
        '.github/workflows/forge-check.yml',
        'README.md',
        '.gitignore',
      ]),
    );
    expect(files['package.json']).toContain('"name": "my-docs"');
    expect(files['package.json']).toContain('@docforge/cli');
    expect(files['docs/index.md']).toContain('status: draft');
    // The gate that enforces the invariant must be wired into CI.
    expect(files['.github/workflows/forge-check.yml']).toContain('forge check');
  });
});

describe('scaffold', () => {
  it('writes every template file into the target dir', () => {
    const dir = newDir();
    const res = scaffold({ target: dir, name: 'my-docs' });
    expect(res.created).toContain('docforge.config.ts');
    expect(existsSync(join(dir, 'docs/index.md'))).toBe(true);
    expect(readFileSync(join(dir, 'package.json'), 'utf8')).toContain('my-docs');
  });

  it('skips existing files unless force is set', () => {
    const dir = newDir();
    scaffold({ target: dir, name: 'x' });
    const again = scaffold({ target: dir, name: 'x' });
    expect(again.created).toEqual([]);
    expect(again.skipped).toContain('docforge.config.ts');
    const forced = scaffold({ target: dir, name: 'x', force: true });
    expect(forced.created).toContain('docforge.config.ts');
  });
});
