# Trade Entry Comments Field

**Date:** 2026-07-03

## Feature Request

Add a free-text "comments" field to a trade entry, so users can attach a note to each
trade. The `development` worktree already has an equivalent field (`comment`) used to
hold text pulled from a voice-transcription flow — this proposal covers adding the same
field to the main app's `tradeEntries`, without pulling in the voice/transcription feature
itself. If/when transcription is added later (voice-to-comment or otherwise), it should
be built as its own encapsulated service rather than embedded inside a domain-specific
flow, so any feature can reuse raw audio→text without depending on trade-entry logic.

## Findings

- **Relevant code (main repo, `feat/simple-mode`):**
  - `packages/api/src/db/schema.ts:14-25` — `tradeEntries` table: `id`, `sessionId`,
    `decision`, `result`, `r`, `successRatio`, `entryAt`, `createdAt`. No free-text column
    exists on this table or on `sessions`.
  - `packages/api/src/routes/sessions.ts:7-10,38-49` — `POST /:sessionId/trade-entries`,
    input type `CreateTradeEntryInput { result?, r? }`.
  - `packages/api/src/routes/tradeEntries.ts:6-24` — `PATCH /:id`, input type
    `UpdateTradeEntryInput { result?, r?, entryAt? }`.
  - `packages/api/src/services/tradeEntries.ts:46-93` — `create()` and `update()` both
    explicitly whitelist fields when building the insert/update `.set()`/`.values()` — a
    new field must be added to both the input type and this whitelist or it's silently
    dropped.
  - `apps/mobile/src/app/(tabs)/sessions/[id]/index.tsx:118-172` — edit state
    (`editingEntry`, `editResult`, `editR`, `editEntryAt`) and the `Modal` (lines 295-382)
    with `ResultSegment` and an R input; this is where a comment `TextInput` would go.
    Save handler (`useCallback`, lines 157-172) calls `updateTradeEntry.mutate({...})`.
  - `apps/mobile/src/hooks/queries/use-trade-entries.ts` — `useCreateTradeEntry` (line 22)
    and `useUpdateTradeEntry` (line 67) both use the optimistic
    `onMutate`/`onError`/`onSettled` pattern from the `2026-07-02-optimistic-updates`
    proposal; `mutationFn` payloads (`json: {...}`) and the optimistic entry object
    (lines 39-48, 86) enumerate fields explicitly and would need `comment` added.
  - `apps/mobile/src/lib/api.ts:14-36` — no shared zod/types package; types flow via Hono
    `hc<AppType>` RPC inference (`TradeEntry` type derived from the API's response type),
    so adding the column to the Drizzle schema + route input types is sufficient for the
    mobile side to pick up the new field with full type safety.

- **Existing pattern (worktree `development`):**
  - Schema: a plain nullable `text("comment")` column added directly to the entry table
    (analogous file: `packages/api/src/db/schema.ts`, `logEntries` table) — no separate
    table, no FK. This is the exact shape to mirror for `tradeEntries`.
  - The voice/transcription flow in that worktree ultimately funnels its extracted text
    into this same `comment` column via the normal create-entry `POST` — i.e., even in the
    worktree, `comment` is a first-class, independently useful field, not something
    voice-specific. That confirms it can be lifted on its own.
  - **Coupling issue worth flagging:** `packages/api/src/services/voice.ts` (worktree)
    bundles two unrelated concerns into one `voiceService.processVoiceEntry()`: (1) raw
    audio → text via `transcribe({ model: openai.transcription("whisper-1"), ... })`
    (lines 85-92), and (2) trade-specific structured extraction via `generateObject`
    against a hand-built system prompt listing the user's setups/characteristics (lines
    94-129). The transcription call itself is generic and has zero dependency on
    trade/setup data — it's only coupled today because it lives inside the same function.
    There is no dedicated transcription service/module anywhere in the worktree; every
    caller would have to reimplement the `transcribe()` call and mimeType handling.

- **Integration points:**
  - Drizzle migration (new `packages/api/drizzle/000N_*.sql`, Drizzle Kit
    auto-generated, following the worktree's/main repo's existing numbering convention).
  - `CreateTradeEntryInput` / `UpdateTradeEntryInput` types and the `create()`/`update()`
    whitelists in `packages/api/src/services/tradeEntries.ts`.
  - Mobile edit modal in `sessions/[id]/index.tsx`, plus the `TradeCard` display (around
    line 97-99, next to the `entryAt` display) if comments should also show in the list.
  - `useCreateTradeEntry`/`useUpdateTradeEntry` mutation payloads and optimistic
    `setQueryData` objects in `use-trade-entries.ts`.

## Recommended Approach

Add `comment: text("comment")` (nullable) to `tradeEntries` in
`packages/api/src/db/schema.ts:14-25`, matching the worktree's `logEntries.comment`
column exactly — no new table, no migration complexity beyond a standard Drizzle Kit
`generate`.

On the API side, add `comment?: string | null` to both `CreateTradeEntryInput`
(`routes/sessions.ts:7-10`) and `UpdateTradeEntryInput` (`routes/tradeEntries.ts:6-10`),
then thread it through `tradeEntriesService.create()`/`update()`
(`services/tradeEntries.ts:46-93`) the same way `r`/`entryAt` are handled today (nullable
passthrough for update, default `""` or `null` for create).

On mobile, add `editComment` state next to `editR`/`editEntryAt`
(`sessions/[id]/index.tsx:118-121`), a `TextInput` in the edit `Modal` (lines 295-382)
below the existing R input, include it in the save handler's mutate call (line
167-169), and add `comment` to the `useUpdateTradeEntry`/`useCreateTradeEntry`
mutation payloads and optimistic objects in `use-trade-entries.ts` (lines 39-48, 70-89)
following the exact same field-mirroring pattern already used for `r` and `entryAt`.
Optionally surface it in `TradeCard` (line 97-99) if it should be visible without
opening the edit modal — recommended, since a comment nobody sees defeats the purpose.

This is a small, self-contained change that reuses every pattern already in the file —
no new abstractions, no shared-types package, no voice/transcription infra needed.

### If/when transcription is added

Should a voice-to-comment (or any other transcription) flow be pulled in later, don't
port `voiceService.processVoiceEntry` as-is — split it. Extract the generic audio→text
step into its own module, e.g. `packages/api/src/services/transcription.ts`:

```ts
export const transcriptionService = {
  transcribeAudio: async (audio: File): Promise<string> => {
    const audioBuffer = await audio.arrayBuffer();
    const { text } = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: new Uint8Array(audioBuffer),
      mimeType: (audio.type || "audio/mp4") as Parameters<typeof transcribe>[0]["mimeType"],
    });
    return text;
  },
};
```

Keep the trade/setup-specific `generateObject` prefill logic (system prompt, setup
matching, `prefillSchema`) in its own domain service (e.g. a leaner `voice.ts` or inline
in `tradeEntries.ts`), which calls `transcriptionService.transcribeAudio()` rather than
inlining the Whisper call. That way a plain "record a voice comment" feature — or any
future speech-to-text use — can call `transcriptionService.transcribeAudio()` directly
without depending on trade-entry/setup schema at all, and the worktree's richer
prefill-extraction behavior stays an optional layer on top.
