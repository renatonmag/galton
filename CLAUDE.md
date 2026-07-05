@AGENTS.md

# Communication

Always write in English only. Never mix in Portuguese or any other language.

# Tech Stack

**Monorepo** with two packages: `apps/mobile` (Expo app) and `packages/api` (Hono backend).

## Language & Runtime

- TypeScript 6.0 (mobile), 5.8 (API)

## Mobile — `apps/mobile`

- Expo v56 + React Native 0.85 + React 19
- Expo Router v56 (file-based routing, typed routes enabled)
- React Native Reanimated v4 + Gesture Handler
- Expo UI, Expo Symbols, Expo Image, Expo Glass Effect

## Backend — `packages/api`

- Hono v4 (deployed to Vercel)
- Vercel AI SDK v7 (server-side AI integration)
- OpenAI (Whisper for transcription, GPT-5.4-mini for structured output)

## Data & Auth

- Supabase (PostgreSQL + Auth — magic link & Google OAuth)
- Drizzle ORM

## API Communication

- Hono `hc` RPC client (end-to-end type-safe RPC between mobile and API)

## Build & Deployment

- EAS (Expo Application Services) for mobile builds
- Vercel for backend deployment
- ESLint via `expo lint`

## Notable Experiments

- React Compiler enabled (Expo v56+)

## Agent skills

### Issue tracker

Issues are tracked as GitHub Issues in renatonmag/galton (via the `gh` CLI). External PRs are not treated as a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix) — no remapping. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
