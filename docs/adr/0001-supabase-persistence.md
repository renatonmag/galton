# Cloud persistence via Supabase + Drizzle, accessed through Hono backend

Data is stored in Supabase (Postgres). All data access goes through the Hono.js backend using Drizzle as the ORM — the Expo app never queries the database directly. The Expo client uses Hono's `hc` RPC client for end-to-end type safety without a separate tRPC layer. Drizzle schema lives in the backend package; types flow into Hono route definitions and then into the client. Local-only SQLite was ruled out for cross-device availability.
