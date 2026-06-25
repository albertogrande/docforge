---
"create-docforge": minor
---

Add `create-docforge` — `npm create docforge my-docs` scaffolds a new Forge-governed docs repo:
`docforge.config.ts`, a starter `docs/index.md`, a `package.json` wired to `@docforge/cli`, a
`forge check` CI workflow (the gate that enforces the no-self-promotion invariant), and a README
explaining the producer loop and MCP setup.
