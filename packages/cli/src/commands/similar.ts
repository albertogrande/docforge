// SPDX-License-Identifier: Apache-2.0
import { createContentSource, findSimilar, findSimilarToText } from '@getnema/core';
import { defineCommand } from 'citty';
import { errOut, out } from '../util.js';

export const similarCommand = defineCommand({
  meta: {
    name: 'similar',
    description: 'Find existing pages similar to a page or some text (dedup before you draft)',
  },
  args: {
    target: {
      type: 'positional',
      required: false,
      description: 'Page path to compare (omit with --query)',
    },
    query: { type: 'string', description: 'Free text to compare instead of an existing page' },
    dir: { type: 'string', description: 'Repo root (default: cwd)' },
    limit: { type: 'string', description: 'Max results (default 5)' },
    'min-score': { type: 'string', description: 'Drop results at or below this score (0–1)' },
    json: { type: 'boolean', description: 'Emit machine-readable JSON' },
  },
  async run({ args }) {
    const rootDir = args.dir ? String(args.dir) : process.cwd();
    const query = args.query ? String(args.query) : undefined;
    const target = args.target ? String(args.target) : undefined;

    if (!query && !target) {
      errOut('Pass a page path, or --query "<text>". See `nema similar --help`.');
      process.exitCode = 1;
      return;
    }

    const limit = args.limit ? Number(args.limit) : 5;
    const minScore = args['min-score'] ? Number(args['min-score']) : 0;
    const source = await createContentSource(rootDir);

    if (target && !query && !source.getPage(target)) {
      errOut(`No page found for "${target}". Use \`nema list\`/the corpus to see valid paths.`);
      process.exitCode = 1;
      return;
    }

    const hits = query
      ? findSimilarToText(source.pages, { body: query }, { limit, minScore })
      : findSimilar(source.pages, target!, { limit, minScore });

    if (args.json) {
      out(JSON.stringify({ target: target ?? null, query: query ?? null, hits }, null, 2));
      return;
    }

    const subject = query ? 'the given text' : `"${target}"`;
    if (hits.length === 0) {
      out(`No pages similar to ${subject} (nothing above score ${minScore}).`);
      return;
    }
    out(`Pages similar to ${subject}:`);
    for (const h of hits) out(`  ${h.score.toFixed(2)}  ${h.path} — ${h.title}`);
    out('\nDocumenting an existing topic? Update the closest page instead of adding a duplicate.');
  },
});
