import { Hono } from "hono";
import { validator } from "hono/validator";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { behaviorInsightExtractionService } from "../services/behaviorInsightExtraction.js";

type ExtractQuery = { run_next?: string };

const app = new Hono<AppEnv>()
  .use(authMiddleware)
  .post(
    "/extract",
    validator("query", (value) => value as ExtractQuery),
    async (c) => {
      const userId = c.get("userId");
      const { run_next } = c.req.valid("query");

      if (run_next === "true") {
        const outcome = await behaviorInsightExtractionService.reinforceForUser(userId);
        if (outcome.skipped) {
          return c.json({ skipped: true as const, reason: outcome.reason }, 200);
        }
        return c.json({ skipped: false as const, ...outcome }, 200);
      }

      const outcome = await behaviorInsightExtractionService.extractForUser(userId);
      if (outcome.skipped) {
        return c.json({ skipped: true as const, reason: outcome.reason }, 200);
      }
      return c.json(
        { skipped: false as const, noticedNothing: outcome.created.length === 0, insights: outcome.created },
        outcome.created.length > 0 ? 201 : 200,
      );
    },
  )
  .get("/pending-count", async (c) => {
    const userId = c.get("userId");
    const pendingCount = await behaviorInsightExtractionService.pendingCount(userId);
    return c.json({ pendingCount });
  });

export const behaviorInsightsRoutes = app;
export type BehaviorInsightsRoutes = typeof app;
