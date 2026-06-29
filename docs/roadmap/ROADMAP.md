# Galton — Roadmap

## Current state

- **Auth** — magic link + Google OAuth
- **Strategies** — create, list, view
- **Setups** — create, list, view (within a Strategy)
- **Characteristics** — create (boolean + multiple-choice), ordered list per Setup

---

## Phase 1 — Session & Log Entry (core journal loop)

The minimum viable journal: the user opens a Session, logs entries manually, and closes it.

### Data model

Add to schema:

```
sessions                   id, user_id, name (auto: date), opened_at, closed_at (null = open)
log_entries                id, session_id, setup_id, decision (TRADE | NO_TRADE), result (null | success | failure), profit, loss, comment, created_at
log_entry_characteristics  log_entry_id, characteristic_id, value (boolean or option string)
```

### API

- `POST   /sessions` — create (auto-names by date)
- `GET    /sessions` — list (open first, then closed)
- `PATCH  /sessions/:id/close` — close Session
- `POST   /sessions/:sessionId/log-entries` — create Log Entry with Characteristics filled
- `PATCH  /log-entries/:id` — edit a Log Entry; all fields except `id`, `session_id`, `setup_id`, and `decision` are mutable (result, profit, loss, comment, characteristics and created_at)

### Mobile

- **Session list screen** — open / start new Session
- **Session screen** — list of collapsed Log Entry cards + floating mic button (bottom right)
  - Collapsed card shows: Decision badge (TRADE green / NO TRADE red), Setup name, Result icon (✓ / ✗), Win Rate %
  - Tap a card to expand the Log Entry detail/edit view
- **Voice flow** — mic button records audio → API returns matched Setup + prefill → **Setup match screen** shows the identified Setup and extracted Characteristics for user confirmation before opening the Log Entry form
- **Log Entry form** — shows Decision badge + Setup name at top, Characteristics as colored checkboxes, Profit/Loss fields, Comment textarea; user fills and saves

---

## Phase 2 — Voice input → Setup match → Prefill

The AI-powered entry path. User sends a voice note; the app transcribes it, identifies the most likely Setup, and prefills the Log Entry form.

### Flow

```
[User holds mic button]
        ↓
[Audio recorded on device]
        ↓
POST /sessions/:id/log-entries/voice  (multipart: audio file)
        ↓
[API: Whisper transcription]
        ↓
[API: GPT structured output]
   — match Setup from user's pool (fuzzy name + description match)
   — extract Characteristics values from transcript
        ↓
[API returns: { setupId, transcription, prefill: { characteristics: [...] }, confidence }]
        ↓
[Mobile: open Log Entry form pre-filled, user reviews and confirms]
        ↓
[POST /sessions/:id/log-entries with confirmed data]
```

### API

`POST /sessions/:sessionId/log-entries/voice`

- Accepts `multipart/form-data` with `audio` field
- Whisper → transcript text
- GPT call with:
  - System prompt: all user Setups + Descriptions + their Characteristics (names and options)
  - User message: transcript
  - Structured output schema:

```typescript
{
  setupId: string | null,          // UUID of best matching Setup, null if no match
  confidence: "high" | "low",
  characteristics: {
    characteristicId: string,
    value: boolean | string,       // boolean for boolean type, option string for multiple_choice
  }[],
  comment: string | null,          // extracted free-text note
}
```

- Returns the object above; no Log Entry is written yet, show setup name (user must confirm on screen)

### Mobile

- **Mic button** on Session screen (replaces or sits beside the manual "+" button)
- Records audio using `expo-audio`
- Sends to `/voice` endpoint, shows loading state
- On response: opens Log Entry form pre-filled (setupId pre-selected, Characteristics pre-toggled)
- Low-confidence matches show a warning banner; no match shows an error with fallback to manual form
- User can edit any field before confirming

### Guardrails

- If `setupId` is null → prompt user to pick a Setup manually
- If a Characteristic value is missing → leave it blank, user fills it before saving
- Transcript always shown so user can verify what was captured

---

## Phase 3 — Recommendation & Mathematical Expectation

Compute the recommendation engine and surface statistics.

### Mathematical Expectation formula

```
ME = (Win Rate × avg Profit) − (Loss Rate × avg Loss)
```

Requires ≥ 10 Log Entries with Result set; display "insufficient data" below that threshold.

### API

`GET /setups/:setupId/stats`

```typescript
{
  totalLogEntries: number,
  withResult: number,
  winRate: number | null,              // null if < 10
  avgProfit: number | null,
  avgLoss: number | null,
  mathematicalExpectation: number | null,
  recommendation: "TRADE" | "NO_TRADE" | null,
}
```

### Mobile

- **Setup screen** — show ME, Win Rate, and Recommendation badge
- **Log Entry form** — after Setup is selected, show the current Recommendation prominently before the user confirms Decision
- Voice flow — include Recommendation in the prefill response so it's visible immediately

---

## Phase 4 — History Dashboard

Read-only analytics tab.

- Per-Strategy and per-Setup breakdown: Win Rate, ME, total Log Entries, total P&L
- Global P&L across all Log Entries
- Filter by Session date range
- Setups with "insufficient data" shown separately with a progress indicator toward 10 Log Entries

---

## Phase 5 — Polish & scale

- **Comment via voice** — voice note attached to an existing Log Entry after the fact
- **Session summary** — auto-generated summary when closing a Session (wins, losses, net P&L)
- **Notifications** — reminder to log Result on open Log Entries at end of day
- **Offline support** — queue Log Entries locally, sync when back online
- **Setup reordering** — drag-and-drop Setups and Characteristics
