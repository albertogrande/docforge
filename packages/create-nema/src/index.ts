#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { basename, resolve } from 'node:path';
import { scaffold } from './scaffold.js';

const positional = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const flags = process.argv.slice(2).filter((a) => a.startsWith('-'));
const target = positional[0] ?? '.';
const name = basename(resolve(target));
const force = flags.includes('--force');

try {
  const result = scaffold({ target, name, force });
  for (const f of result.created) process.stdout.write(`  created  ${f}\n`);
  for (const f of result.skipped) process.stdout.write(`  skipped  ${f} (exists, use --force)\n`);
  process.stdout.write(
    `\n✓ Nema docs scaffolded in ${result.dir}\n\nNext:\n${
      target === '.' ? '' : `  cd ${target}\n`
    }  npm install\n  npm run check\n`,
  );
} catch (error) {
  process.stderr.write(`create-nema failed: ${(error as Error).message}\n`);
  process.exit(1);
}
