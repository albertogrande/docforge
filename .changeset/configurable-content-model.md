---
"@docforge/core": minor
"@docforge/gates": minor
---

Make the content model configurable per deployment. `docforge.config.*` may now supply a
`contentModel` (required fields, enums, dates); it flows through `resolveConfig` into
`ResolvedConfig.contentModel`, and the gates honor it (`createGateContext` resolves
`opts.model ?? config.contentModel ??` the bundled SSOT). The agent-may-only-draft invariant
stays hardcoded and is unaffected.
