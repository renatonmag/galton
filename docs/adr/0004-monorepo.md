# Monorepo for Expo app and Hono backend

The Expo app and Hono backend live in the same monorepo. Both are TypeScript, so Hono's `hc` RPC client can import route types from the backend package directly at development time without a publish step. Separate repos would break the type inference that makes the RPC client useful.
