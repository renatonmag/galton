# Authentication via Supabase Auth (magic link + Google OAuth)

Supabase Auth handles authentication with two methods: magic link (email) and Google OAuth. Clerk was considered for its Expo SDK and polished components, but Supabase Auth keeps the stack unified — one less third-party dependency and no need to bridge Clerk JWTs into Supabase RLS.
