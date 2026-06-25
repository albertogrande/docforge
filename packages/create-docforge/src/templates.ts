// SPDX-License-Identifier: Apache-2.0

export interface TemplateOptions {
  /** Project name, written into the scaffolded package.json. */
  name: string;
}

/**
 * The files a new Forge docs repo starts with — a working producer loop on the
 * published packages. Pure: returns a `path → content` map with no I/O, so it is
 * trivially testable. The generated `forge check` workflow is the load-bearing
 * piece: its `draft-pages-not-reviewed` gate makes self-promotion impossible.
 */
export function templates(opts: TemplateOptions): Record<string, string> {
  const pkg = {
    name: opts.name,
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      check: 'forge check',
      draft: 'forge draft',
      'open-pr': 'forge open-pr',
    },
    devDependencies: {
      '@docforge/cli': '^0.1.0-alpha.0',
    },
  };

  return {
    'docforge.config.ts': `// SPDX-License-Identifier: Apache-2.0
import type { ForgeConfig } from '@docforge/core';

const config: ForgeConfig = {
  contentDir: 'docs',
  reviewSlaDays: 180,
};

export default config;
`,
    'docs/index.md': `---
title: Home
status: draft
---

# Home

Welcome to your Forge docs. Draft new pages through the producer loop:
\`forge draft\` (or the MCP write-tools) → \`forge open-pr\` → human approval.
`,
    'package.json': `${JSON.stringify(pkg, null, 2)}\n`,
    '.github/workflows/forge-check.yml': `# SPDX-License-Identifier: Apache-2.0
name: forge check
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npm run check
`,
    '.gitignore': 'node_modules\n',
    'README.md': `# ${opts.name}

Governed documentation, powered by [Forge](https://github.com/albertogrande/docforge).

## The producer loop

1. An agent **drafts** a page — \`npm run draft\` or the MCP write-tools — writing \`status: draft\`
   with a seeded provenance block, then self-checks against the gates.
2. **Propose** — \`forge open-pr\` opens a PR labeled \`forge:draft\`.
3. **CI** runs \`forge check\` (the \`forge check\` workflow in this repo) — every gate, including
   \`draft-pages-not-reviewed\`, which makes it impossible to publish an unreviewed page as trusted.
4. **A human approves** the PR. That approval is the only path to \`reviewed\`.

## Use it

\`\`\`sh
npm install
npm run check          # run the gates
\`\`\`

## Let an agent author it (MCP)

Point an MCP-capable agent at this repo:

\`\`\`sh
claude mcp add forge -- npx -y @docforge/cli mcp .
\`\`\`

The agent can list, search, read, and **draft** pages — but it cannot promote a page to
\`reviewed\`. Only a human PR approval can.
`,
  };
}
