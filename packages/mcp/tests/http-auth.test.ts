// SPDX-License-Identifier: Apache-2.0
import type { Server } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startHttpServer } from '../src/server.js';

const servers: Server[] = [];
function track(s: Server): Server {
  servers.push(s);
  return s;
}

afterEach(() => {
  for (const s of servers.splice(0)) s.close();
  vi.restoreAllMocks();
});

function portOf(s: Server): number {
  const a = s.address();
  if (a && typeof a === 'object') return a.port;
  throw new Error('server has no bound port');
}
function url(s: Server, path = '/'): string {
  return `http://127.0.0.1:${portOf(s)}${path}`;
}

const INIT_BODY = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 't', version: '0' },
  },
});
const MCP_HEADERS = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
};

describe('HTTP MCP bearer auth', () => {
  it('rejects unauthenticated / wrong-token requests and accepts the right token', async () => {
    const server = track(
      await startHttpServer(
        { rootDir: process.cwd() },
        { port: 0, readOnly: true, authToken: 'secret' },
      ),
    );

    const health = await fetch(url(server, '/health'));
    expect(health.status).toBe(200);

    const noAuth = await fetch(url(server), {
      method: 'POST',
      headers: MCP_HEADERS,
      body: INIT_BODY,
    });
    expect(noAuth.status).toBe(401);

    const wrong = await fetch(url(server), {
      method: 'POST',
      headers: { ...MCP_HEADERS, authorization: 'Bearer nope' },
      body: INIT_BODY,
    });
    expect(wrong.status).toBe(401);

    const right = await fetch(url(server), {
      method: 'POST',
      headers: { ...MCP_HEADERS, authorization: 'Bearer secret' },
      body: INIT_BODY,
    });
    expect(right.status).not.toBe(401);
  });

  it('serves unauthenticated and warns when no token is configured', async () => {
    const warn = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const server = track(
      await startHttpServer({ rootDir: process.cwd() }, { port: 0, readOnly: true }),
    );

    expect(warn.mock.calls.some((c) => String(c[0]).includes('no auth token'))).toBe(true);

    const res = await fetch(url(server), { method: 'POST', headers: MCP_HEADERS, body: INIT_BODY });
    expect(res.status).not.toBe(401);
  });
});
