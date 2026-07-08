import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { behaviorInsightExtractionService } from "../services/behaviorInsightExtraction.js";

const app = new Hono<AppEnv>()
  .use(authMiddleware)
  .post("/extract", async (c) => {
    const userId = c.get("userId");
    const outcome = await behaviorInsightExtractionService.runForwardPass(userId);
    if (outcome.skipped) {
      return c.json({ skipped: true as const, reason: outcome.reason }, 200);
    }
    return c.json({ skipped: false as const, ...outcome }, 200);
  })
  .get("/pending-count", async (c) => {
    const userId = c.get("userId");
    const pendingCount = await behaviorInsightExtractionService.pendingCount(userId);
    return c.json({ pendingCount });
  });

export const behaviorInsightsRoutes = app;
export type BehaviorInsightsRoutes = typeof app;
