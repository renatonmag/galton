# Post-Session Review Notification

**Date:** 2026-07-04

**Status:** Exploratory only — not being built yet. This document is a record of a
`/grill-me` interview that scoped the feature; no code has been written.

## Feature Request

Original request: "I want a feature to make a review after every session that has
trades. I want a notification, the time can be set by the user in preferences. The
review will happen on the session/[id]/index page."

## Findings

- **Sessions have no end/close concept today.** `packages/api/src/db/schema.ts:7-12` —
  `sessions` has only `id`, `userId`, `name` (auto-generated date string, e.g. "Jul 4,
  2026"), `openedAt`. No `closedAt`, no status enum. `packages/api/src/services/sessions.ts`
  exposes only `list`/`create`/`delete` — there is no "end session" action to hang a
  post-session moment off of.

- **Trades:** `packages/api/src/db/schema.ts:14-26` — `tradeEntries`, FK `sessionId` →
  `sessions.id` (cascade delete). Fields: `decision` (`TRADE`/`NO_TRADE`), `result`
  (`open`/`profit`/`loss`/`breakeven`), `r`, `successRatio`, `entryAt`, `comment`
  (nullable text), `createdAt`.

- **No existing "review" concept anywhere** — grepped both packages for `review`, zero
  matches. The only narrative field today is `tradeEntries.comment`
  (`services/tradeEntries.ts:101-117`, `appendComment`), which is per-trade, not
  per-session.

- **No notification infrastructure.** `expo-notifications` is not in
  `apps/mobile/package.json`. No cron/job package in `packages/api/package.json`, no
  `vercel.json` crons array, no scheduling code anywhere in `src/`.

- **No preferences/settings table or screen anywhere.** Confirmed via grep across both
  packages.

- **Mobile route is `(tabs)/sessions/[id]/index.tsx`**, not `session/[id]/index` as
  named in the request — same page the user meant, just under the `(tabs)/sessions`
  group. Sibling `edit.tsx` exists for editing a single trade entry.

- **Nav today is two tabs only** (`apps/mobile/src/app/(tabs)/_layout.tsx`): Home and
  Sessions. No profile/settings tab or screen exists to hang a new preference off of.

## Decisions Reached (in interview order)

1. **No session close/end action.** Sessions keep their current open-ended shape; the
   feature does not add a closing lifecycle. "Session is over" is not tracked explicitly
   — eligibility is computed at notification time instead (see Decision 4).

2. **Reviewed tracking:** add an explicit **`reviewedAt` nullable timestamp on
   `sessions`**, set via a user-triggered "Mark as reviewed" action (not inferred from
   comment completeness).

3. **Review content:** no new review entity/schema. "Reviewing" a session means adding
   freeform **comments on that session's existing `tradeEntries.comment` field** — reuses
   the field already in the schema.

4. **Notification scope:** at the user's configured time, check **only today's**
   sessions (by `openedAt` date) that have at least one `tradeEntries` row (any
   `decision`, including `NO_TRADE` — see Decision 9) and `reviewedAt IS NULL`.

5. **Delivery mechanism:** **local notifications only** via `expo-notifications`. No
   server push, no Expo push tokens, no backend cron. The app schedules/reschedules the
   local notification in the foreground (on trade add, on review marked, on app
   open/resume) for the user's configured time, conditioned on today's eligibility.
   `expo-background-task` was considered and explicitly **rejected** — local scheduled
   notifications already fire while the app is fully closed; a background task would
   only add a periodic resync (e.g. for multi-device edits), which isn't worth the
   native config and non-deterministic (~15+ min) timing it requires.

6. **Preference storage:** new **server-side `userPreferences` table** (keyed by
   `userId`, holding the notification time), synced via the existing Hono RPC API —
   consistent with how sessions/trades are already stored in Supabase, and survives
   reinstalls/device switches.

7. **Settings UI location:** **no new tab.** A modal/screen reached from the Home tab
   (e.g. a gear icon/button — none exists yet, needs to be added) holds the time picker.

8. **Multi-session handling:** if today has more than one qualifying session, the
   notification uses **generic text** (e.g. "You have sessions to review") and deep-links
   to the **Sessions list**, rather than guessing a single target session.

9. **"Has trades" scope:** **any** `tradeEntries` row counts, including `NO_TRADE`
   entries — a no-trade/discipline day is still considered review-worthy, not just days
   with an actual `TRADE`.

10. **Default state: opt-in.** No notification is scheduled and no OS permission prompt
    is shown until the user visits the new preference screen and picks a time
    themselves. No default time is pre-filled.

11. **Reopening after new trades:** if a user adds a new trade entry to a session
    **after** it's already been marked reviewed, `reviewedAt` is **left untouched** (not
    reset to null, not auto-reopened). Re-review is a manual action only (see Decision
    12).

12. **Review UI placement:** the review action lives in a **menu button at the top of
    the session page** (not a standalone gated button). It is **not gated** on having
    added any comments — always available once eligible (see Decision 13). The user can
    manually **reopen/re-activate a review** via the same menu after it's been marked
    reviewed.

13. **Empty-session case:** the Review menu action is **hidden/disabled** on a session
    with zero trade entries — matches the eligibility rule in Decision 9; there's nothing
    to review with no entries at all.

## Open Questions (not yet resolved — interview was cut short)

- Exact wording/copy for the notification and the "no sessions to review" empty state.
- Exact toggle mechanics of "reopen review via menu" — does re-activating set
  `reviewedAt` back to `null` outright, or introduce a distinct reopened state?
- Exact schema for `userPreferences` (just a time string/column, or room for future
  preferences), and the new API route shape for reading/writing it.
- Exact rescheduling trigger points to implement in the mobile app (which specific
  lifecycle events re-run the local-notification scheduling check), and how the OS
  notification permission prompt is worded/timed relative to the time picker.
- Icon/placement details for the new gear/settings entry point on the Home tab (none
  exists today).

## Suggested Implementation Sketch (for future reference only)

- **Schema:** add `reviewedAt` (nullable timestamp) to `sessions` in
  `packages/api/src/db/schema.ts`. New `userPreferences` table (`userId` FK,
  `notificationTime`, `createdAt`/`updatedAt`).
- **Backend:** new `packages/api/src/services/userPreferences.ts` +
  `packages/api/src/routes/userPreferences.ts` (get/upsert). Extend
  `services/sessions.ts`/`routes/sessions.ts` with a `markReviewed`/`reopenReview`
  action, and a query to list today's sessions with trade counts + `reviewedAt` for
  eligibility checks.
- **Mobile:** add `expo-notifications` dependency. New
  `apps/mobile/src/hooks/queries/use-user-preferences.ts` (mirrors existing query hook
  patterns), a settings modal/screen reached from Home, and scheduling logic (likely a
  small module wrapping `Notifications.scheduleNotificationAsync`/`cancelAllScheduled...`)
  invoked from trade-entry creation, review mark/reopen, and app-foreground events. Add
  the Review menu entry to `apps/mobile/src/app/(tabs)/sessions/[id]/index.tsx`, gated on
  entry count per Decision 13.
