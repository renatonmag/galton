# Galton — Simple Mode Context

## What We're Building

A complete refactor of the trading journal app into a simple, focused flow. All strategy/setup/characteristic complexity is removed. The DB is rebuilt from scratch with two tables: `sessions` and `trade_entries`.

## Domain Model

### Session

Container for a group of trades.

| Field     | Type      | Notes             |
| --------- | --------- | ----------------- |
| id        | uuid      | PK                |
| user_id   | uuid      | FK to auth user   |
| name      | text      | Auto-generated    |
| opened_at | timestamp |                   |

### TradeEntry

| Field         | Type      | Notes                                             |
| ------------- | --------- | ------------------------------------------------- |
| id            | uuid      | PK                                                |
| session_id    | uuid      | FK to sessions (cascade delete)                   |
| decision      | enum      | `TRADE` or `NO_TRADE` — the app's recommendation  |
| result        | enum      | `open` (default), `profit`, `loss`, `breakeven`   |
| r             | text      | Risk/reward string e.g. "1/2", "1/5" (user-typed) |
| success_ratio | numeric   | Ratio at the moment of decision (stored)          |
| created_at    | timestamp |                                                   |

## Success Ratio Formula

```
success_ratio = (profit_count + breakeven_count) / (profit_count + breakeven_count + loss_count)
```

- Corpus: **all trade_entries ever**, across all sessions for the user
- `open` entries are **excluded** from the calculation
- Threshold: `>= 0.5` → **TRADE**, `< 0.5` → **NO TRADE**
- No history (zero denominator): always show **TRADE**

## Add Trade Flow

1. User taps **+** button on the session screen (replaces old voice FAB)
2. App fetches all user's trade_entries, computes `success_ratio`
3. A **bottom sheet** appears showing either a green **TRADE** or red **NO TRADE** card with the ratio percentage
4. User taps the card to proceed to the form (same bottom sheet, next step)
5. Form inputs:
   - **Result**: segmented buttons — `open` (default) | `profit` | `loss` | `breakeven`
   - **R**: free-text input (e.g. "1/2")
6. On save: `decision`, `result`, `r`, `success_ratio`, and `created_at` are written to `trade_entries`

## Session Screen

- Lists trade_entries as cards (green = TRADE, red = NO TRADE)
- Each card shows: decision label, check/X icon, success_ratio % at decision time
- **+** FAB in bottom-right corner

## Tab Bar

Two tabs only: **Home** and **Sessions**. Everything else removed.

## Home Tab

Dashboard showing:

- Big overall success ratio (across all trades ever)
- Breakdown: total count + profit / loss / breakeven / open counts

## Sessions List Screen

Each session row shows: **date** + **trade count**.

- **Create session**: tap a button → auto-generates a name from today's date (e.g. "Jun 30, 2026")
- **Delete session**: edit button at top toggles edit mode → trash icon appears on each row → confirmation alert → delete (cascades to trade entries)

## Session Detail Screen

Lists trade entries as cards (green = TRADE, red = NO TRADE).  
Each card shows: decision label, check/X icon, success_ratio % at decision time.

- **Add Trade**: `+` FAB (bottom-right)
- **Delete trade entry**: edit button at top toggles edit mode → trash icon appears on each card → confirmation alert → delete
- **Edit trade entry**: result and r are editable after save; decision and success_ratio are fixed. In a dialog

## What Was Removed

Everything related to strategies, setups, characteristics, log entries, and voice recording is gone — screens, routes, DB tables, and API endpoints.
