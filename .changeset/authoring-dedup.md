---
"@getnema/core": minor
"@getnema/gates": minor
"@getnema/mcp": minor
"@getnema/cli": minor
---

Authoring intelligence — near-duplicate detection so agents write a page that
*fits* instead of re-documenting a topic that already has one.

- **`@getnema/core` similarity engine** — TF-IDF cosine over the corpus
  (`findSimilar`, `findSimilarToText`, `nearDuplicates`), reusing the same linear
  tokenizer as search. Similarity weights rare, topic-defining vocabulary and
  ignores common filler.
- **`near-duplicate` gate** — `nema check` warns (never fails) when two pages
  exceed a similarity threshold, with `nema explain near-duplicate`. Tuned for
  precision: real corpora of distinct pages sit well below it.
- **`nema similar <path>` / `nema similar --query "<text>"`** — see what already
  covers a topic before drafting (`--json`, `--limit`, `--min-score`).
- **`find_similar` MCP tool** — the same check for agents, returning ranked hits
  as structured content. Exposed on the read-only server too.
