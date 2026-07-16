import { Hono } from "hono";
import { validator } from "hono/validator";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { behaviorInsightExtractionService } from "../services/behaviorInsightExtraction.js";
import {
  behaviorInsightsService,
  validateAuthoredBehavior,
  validateBehaviorPatch,
} from "../services/behaviorInsights.js";

type BehaviorInsightBody = { text?: unknown; type?: unknown };

const app = new Hono<AppEnv>()
  .use(authMiddleware)
  .post("/extract", async (c) => {
    const userId = c.get("userId");
    const outcome = await behaviorInsightExtractionService.runForwardPass(userId);
    if (outcome.skipped) {
      return c.json({ skipped: true as const, reason: outcome.reason }, 200);
    }
    return c.json({ ...outcome, skipped: false as const }, 200);
  })
  .get("/pending-count", async (c) => {
    const userId = c.get("userId");
    const pendingCount = await behaviorInsightExtractionService.pendingCount(userId);
    return c.json({ pendingCount });
  })
  .get("/", async (c) => {
    const userId = c.get("userId");
    const insights = await behaviorInsightsService.listActiveForManagement(userId);
    return c.json({ insights });
  })
  .post("/", validator("json", (value) => value as BehaviorInsightBody), async (c) => {
    const userId = c.get("userId");
    const result = validateAuthoredBehavior(c.req.valid("json"));
    if (!result.ok) return c.json({ error: result.error }, 400);
    const insight = await behaviorInsightsService.createAuthored(userId, result.value);
    return c.json({ insight }, 201);
  })
  .patch("/:id", validator("json", (value) => value as BehaviorInsightBody), async (c) => {
    const userId = c.get("userId");
    const result = validateBehaviorPatch(c.req.valid("json"));
    if (!result.ok) return c.json({ error: result.error }, 400);
    const insight = await behaviorInsightsService.update(userId, c.req.param("id"), result.value);
    if (!insight) return c.json({ error: "Not found" }, 404);
    return c.json({ insight });
  })
  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const insight = await behaviorInsightsService.dismiss(userId, c.req.param("id"));
    if (!insight) return c.json({ error: "Not found" }, 404);
    return c.json({ insight });
  });

export const behaviorInsightsRoutes = app;
export type BehaviorInsightsRoutes = typeof app;
