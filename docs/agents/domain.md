# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

This repo is single-context: one `CONTEXT.md` covers the whole monorepo (`apps/mobile` and `packages/api`), not one per package. There is no `CONTEXT-MAP.md`.

`docs/adr/` doesn't exist yet on this branch (`feat/simple-mode`) — it exists on `development`. Don't flag its absence or suggest creating it upfront; `/domain-modeling` (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates it lazily when a decision actually needs recording.

## File structure

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-....md
│   └── 0002-....md
└── apps/ , packages/
```

Other folders under `docs/` (`roadmap/`, `proposals/`, `prompts/`, `comments/`) are separate working docs, not part of what these skills read.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
