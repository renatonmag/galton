# Optimistic Updates

**Date:** 2026-07-02

## Feature Request

Add optimistic updates across the app's mutations so the UI reflects changes immediately
instead of waiting on the network round-trip.

## Findings

- **Relevant code:** All data mutations live in `apps/mobile/src/hooks/queries/`:
  - `use-sessions.ts` — `useCreateSession`, `useDeleteSession`
  - `use-trade-entries.ts` — `useCreateTradeEntry`, `useUpdateTradeEntry`, `useDeleteTradeEntry`

  That's **5 mutations total**, none currently optimistic. Each uses TanStack Query's
  `useMutation` with only an `onSuccess` handler — no `onMutate`/`onError`/`onSettled`.
  `useCreateSession` and `useDeleteSession` do a manual `setQueryData` on success;
  the trade-entry mutations just `invalidateQueries` and wait for a refetch.

- **Existing patterns:**
  - Query client + query keys are centralized in `apps/mobile/src/lib/query-client.ts`
    (`queryKeys.sessions`, `queryKeys.tradeEntries(sessionId)`, `queryKeys.stats`).
    Mutations reuse these keys — an optimistic implementation should too.
  - Mutations are consumed directly in two screens:
    `apps/mobile/src/app/(tabs)/sessions/index.tsx` (create/delete session, gated by
    `createSession.isPending` on the "New session" button and a confirm `Alert` before
    delete) and `apps/mobile/src/app/(tabs)/sessions/[id]/index.tsx` (create/update/delete
    trade entry, each closing a modal `onSuccess`).
  - `mutations: { retry: 0 }` is set globally in `query-client.ts`, so a failed optimistic
    update won't silently retry — it needs an explicit rollback.

- **Integration points:**
  - `queryClient.setQueryData` for `queryKeys.sessions` and
    `queryKeys.tradeEntries(sessionId)` — the two list caches that back the FlatList/ScrollView
    in each screen.
  - `queryKeys.stats` is invalidated (not optimistically updated) by 3 of the 5 mutations;
    stats derive from trade entries server-side, so it's not straightforward to compute
    optimistically and is probably out of scope.
  - The two `Alert.alert` delete-confirmation flows and the two `Modal`
    create/edit flows are where the perceived latency reduction would actually be felt —
    they're the UI callers that would stay largely unchanged (still call `.mutate(...)`)
    but would see instant list updates instead of waiting for `onSuccess`.

## Recommended Approach

Convert all 5 mutations to the standard TanStack Query optimistic pattern: `onMutate`
cancels in-flight queries for the affected key, snapshots the previous cache value, writes
the optimistic value with `setQueryData`, and returns the snapshot as context; `onError`
rolls back using that snapshot; `onSettled` invalidates to reconcile with the server.

Concretely:
- `useCreateSession` / `useDeleteSession` already do `setQueryData` — move that logic from
  `onSuccess` into `onMutate` (generating a temp client-side id for create, e.g. via
  `crypto.randomUUID()`), add `onError` rollback, and swap `onSuccess` for `onSettled` +
  invalidate so the temp session gets replaced by the real one from the server.
- `useCreateTradeEntry` / `useUpdateTradeEntry` / `useDeleteTradeEntry` need to add
  `onMutate` handlers that mutate `queryKeys.tradeEntries(sessionId)` directly (they
  currently only invalidate), following the same snapshot/rollback shape.
- Since none of these mutations have `onMutate` today, this is a net-new pattern for the
  codebase — introduce it in `use-sessions.ts` first (simpler, 2 mutations, already close
  to the target shape), then mirror it in `use-trade-entries.ts`.
- Leave `queryKeys.stats` as invalidate-only; computing it optimistically would duplicate
  server aggregation logic for uncertain UX benefit.
