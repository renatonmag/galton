# OpenAI via Vercel AI SDK for transcription and structured output

OpenAI handles voice transcription (Whisper) and Registro extraction (GPT-4o with structured output). Calls are made server-side through the Hono.js backend using the Vercel AI SDK — the OpenAI key is never exposed to the client. The Vercel AI SDK was chosen over the raw OpenAI SDK for its typed structured output helpers and streaming support.
