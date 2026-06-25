#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { startHttpServer, startStdioServer } from './server.js';

const rootDir = process.argv[2] ?? process.env.NEMA_ROOT ?? process.cwd();
const port = process.env.NEMA_MCP_PORT ? Number(process.env.NEMA_MCP_PORT) : undefined;
const readOnly = process.env.NEMA_MCP_READONLY === '1';

const start = port
  ? startHttpServer({ rootDir }, { port, readOnly }).then(() => {
      process.stderr.write(
        `nema-mcp (HTTP${readOnly ? ', read-only' : ''}) listening on http://localhost:${port}\n`,
      );
    })
  : startStdioServer({ rootDir });

start.catch((error: unknown) => {
  process.stderr.write(`nema-mcp failed to start: ${String(error)}\n`);
  process.exit(1);
});
