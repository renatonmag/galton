import { defineConfig } from "vitest/config";

// Opts the on-demand LLM evals (*.eval.ts) into a run. These hit real model
// APIs, are non-deterministic, and cost money, so they are kept out of the
// default `vitest run` (which only matches *.test.ts) and run via `pnpm eval`.
export default defineConfig({
  test: {
    include: ["src/**/*.eval.ts"],
  },
});
