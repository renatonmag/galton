# Previous Session Report

**Date:** 2026-07-04

**Status:** Exploratory only — not being built yet. This document is a record of a
`/grill-me` interview that scoped the feature; no code has been written.

## Feature Request

Original request (Portuguese): "Relatório do dia anterior com pontos de acerto e erro e
o que pode ser melhorado, baseado nos comentários para os trades." Translation: a report
on a prior trading session that surfaces what went right, what went wrong, and what
could be improved — generated from the freeform `comment` text attached to each trade
entry in that session.

## Findings

- **Data model (`feat/simple-mode`, current branch):**
  `packages/api/src/db/schema.ts:7-26` — `sessions` (`id`, `userId`, `name`, `openedAt`,
  no `closedAt`) and `tradeEntries` (`id`, `sessionId` FK, `decision`
  TRADE/NO_TRADE, `result` open/profit/loss/breakeven, `r` text, `successRatio`
  numeric, `entryAt`, `comment` nullable text, `createdAt`). No symbol, price, or PnL
  amount fields — `comment` is the only narrative signal.

- **A richer, unmerged alternative exists:** the `development` worktree
  (`/home/rnm/Dev/galton/galton/worktrees/development`) has `strategies` → `setups` →
  `characteristics`, numeric `profit`/`loss` columns, and a `generateObject`+Zod+
  `gpt-5.4-mini` precedent in `services/voice.ts` for extracting structured data from
  trade comments. **Explicitly out of scope for this proposal** — the user asked to
  target only the current schema's `comment` field and win/loss ratio, not the
  setup/characteristic taxonomy.

- **No existing report/insight/summary feature anywhere.** Grepped both apps for
  `report|insight|daily.?review|summary` — the only aggregate is
  `packages/api/src/services/stats.ts` (`GET /stats`, account-wide win-rate numbers, not
  day/session-scoped, not narrative).

- **No cron/scheduling infrastructure.** No `vercel.json` crons array, no EAS Workflows
  YAML. Ruled out proactive/push delivery for this reason (see Decision 2).

- **AI SDK is already a dependency but unused for structured generation on this
  branch:** `packages/api/package.json` has `ai@^7.0.2`, `@ai-sdk/openai@^4.0.3`,
  `zod@^4.4.3` installed. The only current usage is
  `packages/api/src/services/transcription.ts` (`transcribe()` with Whisper). The
  `generateObject` pattern for turning text into structured output only exists in the
  unmerged `development` worktree's `voice.ts` — it would need to be introduced fresh
  here, reusing the same library shape.

- **Session naming today:** `packages/api/src/services/sessions.ts:23-31` —
  `sessionsService.create()` names every new session with today's date
  (`"Nov 3, 2025"` style), no user input. The user wants to replace this with the
  `unique-names-generator` npm package so sessions get memorable, distinguishable names
  for a manual picker UI.

- **Win/loss ratio is already computed deterministically server-side** —
  `packages/api/src/services/tradeEntries.ts:5-29` (`computeDecision`) aggregates
  `result` across non-open entries into a ratio. This is the pattern to reuse/mirror for
  the report's ratio, rather than asking an LLM to calculate it.

- **Mobile RPC/query pattern to reuse:** `apps/mobile/src/lib/api.ts` (`hc<AppType>`
  client), `apps/mobile/src/hooks/queries/use-stats.ts` (simplest `useQuery` example),
  `apps/mobile/src/hooks/queries/use-sessions.ts` (list/create/delete session hooks),
  and the two session screens `apps/mobile/src/app/(tabs)/sessions/index.tsx` (list +
  "New session" button) and `.../sessions/[id]/index.tsx` (session detail, trade cards,
  edit-mode toggle via a `SquarePen` button at line 181-183 — the likely spot for a new
  menu entry point).

## Decisions Reached (in interview order)

1. **Target schema:** build against the current `feat/simple-mode` schema only —
   freeform `tradeEntries.comment` plus `result`/`successRatio`. Do not wait for or
   depend on the `development` worktree's setup/characteristic model.

2. **Trigger:** on-demand, not scheduled/pushed. No cron or push-notification
   infrastructure exists today, and building it would be a materially larger scope than
   the feature itself.

3. **Access pattern:** not an automatic "yesterday" lookup. Instead, a manual session
   picker — from a new session, a menu item opens a picker where the user selects which
   prior session they want a report for. Session names will move from the current
   date-string auto-name to `unique-names-generator`-generated names, so sessions are
   individually recognizable in that picker.

4. **Persistence:** the generated report is **cached**, not regenerated on every view.
   Reasoning: OpenAI calls aren't free, and re-reading a report shouldn't risk different
   wording each time. Implies a new table keyed by `sessionId`.

5. **Entry scope:** **all** entries feed the report, not just `TRADE` ones. `NO_TRADE`
   entries' comments (reasoning for skipping) carry real discipline/decision-quality
   signal that a "what went right/wrong" report should capture.

6. **Open trades:** entries with `result: "open"` are **excluded entirely** from the
   right/wrong narrative (no resolved outcome to judge yet), but the report should still
   **show a count** of how many trades were left open.

7. **Commentless entries:** closed entries with no `comment` are **excluded from the LLM
   input entirely** — they must not influence the qualitative narrative — but still
   count toward the deterministic ratio (see Decision 8).

8. **Win/loss ratio:** computed **deterministically in code** (mirroring
   `computeDecision` in `services/tradeEntries.ts`), not asked of or trusted to the LLM.
   The LLM's role is scoped strictly to generating the qualitative right/wrong/improve
   narrative from closed, commented entries.

## Open Questions (not yet resolved — interview was cut short)

- Output language for the generated report (comments are written in Portuguese; likely
  the report should be too, but this was never confirmed).
- Exact shape of the new report table/columns (structured columns vs. a single JSON
  blob).
- Exact API route shape (e.g. a single lazy-generating `GET`, vs. separate
  generate/fetch endpoints; whether/how a stale report gets regenerated if a comment is
  edited after the report was generated).
- Exact UI: what the new "menu item" looks like, where the session picker lives, and
  the report screen's layout.
- Scope of the `unique-names-generator` swap: only for newly created sessions going
  forward, or also backfilling existing sessions' date-string names.

## Suggested Implementation Sketch (for future reference only)

- **Schema:** new `sessionReports` table — `id`, `sessionId` (FK, unique), report
  content, `createdAt` — added next to `sessions`/`tradeEntries` in
  `packages/api/src/db/schema.ts`.
- **Service:** new `packages/api/src/services/sessionReports.ts` — gathers closed,
  commented entries for a session, computes the ratio/open-count deterministically
  (reusing the `computeDecision` shape from `services/tradeEntries.ts:5-29`), then calls
  `generateObject({ model: openai("gpt-5.4-mini"), schema: <zod schema for
  whatWentRight/whatWentWrong/improvements> })` — the only precedent for this call shape
  is the unmerged `development` worktree's `services/voice.ts`, which would need to be
  adapted rather than copied (no setup/characteristic context here).
- **Route:** new `packages/api/src/routes/sessionReports.ts`, likely
  `GET /sessions/:id/report`, lazily generating and persisting on first call.
- **Mobile:** new `apps/mobile/src/hooks/queries/use-session-report.ts` (mirrors
  `use-stats.ts`), a session-picker UI and a new report screen under
  `apps/mobile/src/app/(tabs)/sessions/`, and a menu entry point added to
  `sessions/[id]/index.tsx` near the existing edit-mode button.
- **Session naming:** swap the date-string logic in `sessionsService.create()`
  (`services/sessions.ts:23-31`) for `unique-names-generator` output.
