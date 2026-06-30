# Galton Simple Mode — Implementation Roadmap

## Phase 1 — DB & API (Backend)

### 1.1 Nuke old schema
- Drop tables: `log_entries`, `log_entry_characteristics`, `characteristics`, `setups`, `strategies`
- Drop enums: `characteristic_type`, `decision` (keep `result` — reuse)
- Write Drizzle migration

### 1.2 New schema
- `sessions`: `id`, `user_id`, `name`, `opened_at`
- `trade_entries`: `id`, `session_id`, `decision` (enum: TRADE | NO_TRADE), `result` (enum: open | profit | loss | breakeven), `r` (text), `success_ratio` (numeric), `created_at`
- Write Drizzle migration

### 1.3 Success ratio service
- Query: count `profit` + `breakeven` + `loss` across **all** `trade_entries` for the user (exclude `open`)
- Return `{ ratio: number | null, decision: "TRADE" | "NO_TRADE" }`
- `null` denominator → `TRADE`
- Threshold: `>= 0.5` → `TRADE`

### 1.4 API routes (Hono)

**Sessions**
- `GET /sessions` — list with trade count per session
- `POST /sessions` — create; auto-generate name from current date
- `DELETE /sessions/:id` — delete (cascades to trade entries)

**Trade Entries**
- `GET /sessions/:sessionId/trade-entries` — list entries for session
- `POST /sessions/:sessionId/trade-entries` — compute ratio → store decision + ratio + result + r
- `PATCH /trade-entries/:id` — update result and r only
- `DELETE /trade-entries/:id` — delete entry

**Stats**
- `GET /stats` — return `{ success_ratio, total, profit, loss, breakeven, open }` for Home tab

### 1.5 Remove dead routes & services
- Delete routes: `strategies`, `setups`, `characteristics`, `logEntries`
- Delete services: `strategies`, `setups`, `characteristics`, `logEntries`, `voice`

---

## Phase 2 — Mobile (Cleanup)

### 2.1 Remove dead screens & navigation
- Delete `(tabs)/strategies/` tree entirely
- Delete `(tabs)/sessions/[id]/voice-match.tsx`
- Update `(tabs)/_layout.tsx` to two tabs: **Home** and **Sessions**

### 2.2 Update API client
- Regenerate/update Hono RPC types to match new routes
- Remove all references to old types (`logEntries`, `setups`, `characteristics`, etc.)

---

## Phase 3 — Sessions List Screen

- Show session rows: auto-generated date name + trade count
- Create session button → `POST /sessions`
- Edit mode toggle (top-right) → reveals trash icon on each row
- Trash → confirmation alert → `DELETE /sessions/:id`
- Tap row → navigate to session detail

---

## Phase 4 — Session Detail Screen

- List trade entries as cards (green = TRADE, red = NO TRADE)
- Each card: decision label + check/X icon + success_ratio %
- Edit mode toggle (top-right) → reveals trash icon on each card
- Trash → confirmation alert → `DELETE /trade-entries/:id`
- Tap card (outside edit mode) → open edit dialog (result segmented buttons + r text input) → `PATCH /trade-entries/:id`

---

## Phase 5 — Add Trade Flow

- `+` FAB on session detail screen
- On tap: fetch `GET /stats` (or compute inline), open bottom sheet
- **Step 1 — Decision card**: full-width green/red card showing TRADE or NO TRADE + ratio %
- Tap card → advance to step 2 (same bottom sheet)
- **Step 2 — Form**:
  - Result: segmented buttons (`open` default | `profit` | `loss` | `breakeven`)
  - R: text input (free-form, e.g. "1/2")
  - Save button → `POST /sessions/:sessionId/trade-entries` → refresh list

---

## Phase 6 — Home Tab

- `GET /stats` on focus
- Display: big success ratio percentage
- Breakdown grid: total / profit / loss / breakeven / open counts

---

## Phase 7 — Auth (No Changes)

Auth screens (`login.tsx`, `verify.tsx`) and Supabase auth config are untouched.
