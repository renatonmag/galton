import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { behaviorInsightExtractionService } from "../services/behaviorInsightExtraction.js";

const app = new Hono<AppEnv>().use(authMiddleware).post("/extract", async (c) => {
  const userId = c.get("userId");
  const outcome = await behaviorInsightExtractionService.extractForUser(userId);

  if (outcome.skipped) {
    return c.json({ skipped: true as const, reason: outcome.reason }, 200);
  }

  return c.json(
    { skipped: false as const, noticedNothing: outcome.created.length === 0, insights: outcome.created },
    outcome.created.length > 0 ? 201 : 200,
  );
});

export const behaviorInsightsRoutes = app;
export type BehaviorInsightsRoutes = typeof app;
