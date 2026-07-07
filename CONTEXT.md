# Galton — Simple Mode Context

## What We're Building

A complete refactor of the trading journal app into a simple, focused flow. All strategy/setup/characteristic complexity is removed. The DB was rebuilt from scratch around `sessions` and `trade_entries`, with `voice_notes`, `user_preferences`, and `daily_reports` added afterward as the flow grew.

## Domain Model

### Session

Container for a group of trades on a given day.

| Field       | Type      | Notes                                  |
| ----------- | --------- | --------------------------------------- |
| id          | uuid      | PK                                      |
| user_id     | uuid      | FK to auth user                         |
| name        | text      | Auto-generated                          |
| opened_at   | timestamp |                                          |
| reviewed_at | timestamp | Null until the user marks it reviewed   |

**Reviewed** is a plain done-marker: the user has looked back over the session's trades and toggled it off their plate. It has no deeper coupling to Daily Reports — it only feeds the daily reminder notification (a session is "eligible" for a reminder if it was opened today, has at least one trade, and isn't reviewed yet).

### TradeEntry

| Field         | Type      | Notes                                                          |
| ------------- | --------- | ---------------------------------------------------------------|
| id            | uuid      | PK                                                              |
| session_id    | uuid      | FK to sessions (cascade delete)                                |
| decision      | enum      | `TRADE` or `NO_TRADE` — the app's recommendation, fixed at creation |
| result        | enum      | `open` (default), `profit`, `loss`, `breakeven`                |
| direction     | enum      | `buy` or `sell`, nullable — set later via edit, not at creation |
| r             | text      | Risk/reward string e.g. "1/2", "1/5" (user-typed)              |
| success_ratio | numeric   | Ratio at the moment of decision (stored)                        |
| entry_at      | timestamp | Nullable — see "Entered vs. observed trades" below              |
| comment       | text      | Nullable free-text reflection, editable, can grow via voice-to-text |
| created_at    | timestamp |                                                                  |

#### Entered vs. observed trades

`entry_at` is null unless the user explicitly sets an entry time when editing the trade. Null is a domain signal, not missing data: it means the trade was never actually entered in the market — the user only logged what the app's decision was and observed/paper-tracked the outcome. A non-null `entry_at` means the user actually took the trade at that time.

This distinction drives the **"no entry win rate"**: the success ratio computed only over closed entries with `entry_at = null`. It answers "when I sat out and just watched, how often would I have been right?" — shown alongside the session's own ratio on the session screen.

### VoiceNote

A lightweight, freestanding spoken note attached to a session — reintroduced after the original simple-mode refactor removed the old voice-driven log-entry flow. It is **not** the same thing as a TradeEntry's `comment`:

- **VoiceNote**: a standalone timeline item (own card, own transcript), created via the record button on the session's add-item FAB. Optionally can reference a `trade_entry_id`, but today's UI always creates it session-scoped, not entry-scoped.
- **TradeEntry.comment**: text that lives *on* a specific trade entry, edited from the Edit Trade screen either by typing or by tapping the mic (which transcribes and appends to the existing comment).

| Field          | Type      | Notes                                              |
| -------------- | --------- | --------------------------------------------------- |
| id             | uuid      | PK                                                   |
| session_id     | uuid      | FK to sessions (cascade delete)                     |
| trade_entry_id | uuid      | Nullable FK to trade_entries (set null on delete)    |
| transcript     | text      | Whisper transcription of the recording               |
| created_at     | timestamp |                                                       |

### UserPreferences

One row per user, holding settings for the daily review reminder.

| Field             | Type | Notes                                    |
| ----------------- | ---- | ----------------------------------------- |
| user_id           | uuid | PK                                        |
| notification_time | time | Nullable — reminder time of day           |
| timezone          | text | Kept in sync with the device automatically |

### DailyReport

An AI-generated weekly narrative coaching summary, keyed by the day it's requested for. One per `(user_id, report_date)`.

| Field          | Type    | Notes                                                     |
| -------------- | ------- | ---------------------------------------------------------|
| id             | uuid    | PK                                                        |
| user_id        | uuid    |                                                            |
| report_date    | date    |                                                            |
| historic_ratio | numeric | Success ratio over all closed entries before the window   |
| week_ratio     | numeric | Success ratio over closed entries inside the 7-day window |
| open_count     | integer | Count of still-open entries inside the window             |
| improvements   | jsonb   | Up to 5 `{ pattern, description, action }` points          |
| strengths      | jsonb   | Up to 5 `{ pattern, description, whyItMatters }` points    |
| created_at     | timestamp |                                                          |

## Success Ratio Formula

```
success_ratio = (profit_count + breakeven_count) / (profit_count + breakeven_count + loss_count)
```

- Corpus: **all trade_entries ever**, across all sessions for the user
- `open` entries are **excluded** from the calculation
- Threshold: `>= 0.5` → **TRADE**, `< 0.5` → **NO TRADE**
- No history (zero denominator): always show **TRADE**

The same formula, scoped to a session's own entries, drives the session-level ratio shown on the session screen header. Scoped to closed entries with `entry_at = null`, it drives the "no entry win rate".

## Add Trade Flow

1. User taps **+** button on the session screen, which expands into **Record Note** and **Add Trade** actions
2. Tapping **Add Trade** opens a bottom sheet showing a green **TRADE** or red **NO TRADE** card with the app's current overall ratio percentage (computed the same way as the Home dashboard, across all of the user's trade entries)
3. Tapping the card immediately creates the trade entry with defaults (`result: open`, empty `r`) and the `decision`/`success_ratio` frozen at that moment — there is no inline form at creation time
4. The user later opens the entry (tap the card on the session screen) to fill in **direction**, **result**, **R**, **entry time**, and a **comment** — see Edit Trade below

## Record Note Flow

Tapping **Record Note** on the same FAB starts a recording; stopping it uploads the audio, transcribes it, and creates a standalone **VoiceNote** on the session (see VoiceNote above) — independent of any trade entry.

## Edit Trade Screen

Opened by tapping a trade card. Editable fields:

- **Direction**: segmented `Buy` / `Sell`
- **Result**: segmented `Open` / `Profit` / `Loss` / `Breakeven`
- **R**: free-text input
- **Entry Time**: time picker — setting this is what marks the trade as actually entered (see "Entered vs. observed trades")
- **Comment**: free-text, or tap the mic to record and transcribe — the transcription is **appended** to the existing comment (not replaced)

`decision` and `success_ratio` are fixed at creation and not editable here.

## Session Screen

- Header shows the session name, the session's own success ratio (only once it has a non-open entry), and the "no entry win rate" (from Home-wide stats)
- Timeline merges **TradeEntry** cards and **VoiceNote** cards, sorted by `created_at`
- Trade cards: decision label, check/X icon, direction arrow (if set), success_ratio % at decision time, created/entry times
- Voice note cards: transcript text, created time
- Clipboard icon: toggle reviewed / reopen review (see Session.reviewed_at)
- Edit-mode pencil icon: toggles trash icons on every card (both trades and notes) for deletion, each behind a confirmation alert
- **+** FAB in bottom-right corner (see Add Trade Flow / Record Note Flow)

## Tab Bar

Two tabs only: **Home** and **Sessions**. A **Settings** screen (notification preferences) and the session **Reports** list are pushed as stack screens, not tabs.

## Home Tab

Dashboard showing:

- Big overall success ratio (across all trades ever)
- Breakdown: total count + profit / loss / breakeven / open counts
- Settings gear (→ notification settings) and sign-out in the header

## Settings Screen

Lets the user set a daily **reminder time**. On save, requests notification permission and schedules a daily local notification that only fires if there's at least one unreviewed session opened today. Requires a development build — unsupported in Expo Go.

## Sessions List Screen

Each session row shows: **date** + **trade count**.

- **Reports** button (top): opens the Daily Reports list
- **Create session**: tap a button → auto-generates a name from today's date (e.g. "Jun 30, 2026")
- **Delete session**: edit button at top toggles edit mode → trash icon appears on each row → confirmation alert → delete (cascades to trade entries and voice notes)

## Daily Reports

A day only produces a report if the user left a **comment** on at least one closed trade entry — the AI narrative is generated from those commented entries only (results without commentary are used solely for the numeric ratios).

- **Window**: 7 days ending at the report date, in the user's stored timezone
- **Qualifying dates**: computed by rolling forward from each date that has a commented entry, by 1–7 days, skipping weekends (Sat/Sun roll to the following Monday) — this is what determines which dates appear in the Reports list
- **Report contents**: `week_ratio` (inside the window), `historic_ratio` (everything before the window), `open_count`, plus up to 5 AI-extracted **improvement points** and up to 5 **strength points**, each requiring evidence from 2+ entries (no single-instance patterns)
- Reports are generated once and cached — requesting the same `(user, date)` again returns the stored report rather than re-running the AI

## What Was Removed

Everything related to strategies, setups, characteristics, and the old log-entry-driven flow is permanently gone — screens, routes, DB tables, and API endpoints. Voice capture was removed in that same refactor, then **reintroduced** later in a different shape: a lightweight, session-scoped `VoiceNote` (see above), not tied to the old log entries.
