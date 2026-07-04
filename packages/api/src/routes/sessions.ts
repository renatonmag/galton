import { Hono } from "hono";
import { validator } from "hono/validator";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { sessionsService } from "../services/sessions.js";
import { tradeEntriesService } from "../services/tradeEntries.js";

type CreateTradeEntryInput = {
  result?: "open" | "profit" | "loss" | "breakeven";
  direction?: "buy" | "sell";
  r?: string;
};

const app = new Hono<AppEnv>()
  .use(authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const result = await sessionsService.list(userId);
    return c.json({ sessions: result });
  })
  .post("/", async (c) => {
    const userId = c.get("userId");
    const session = await sessionsService.create(userId);
    if (!session) return c.json({ error: "Failed to create session" }, 500);
    return c.json({ session }, 201);
  })
  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const session = await sessionsService.delete(c.req.param("id"), userId);
    if (!session) return c.json({ error: "Not found" }, 404);
    return c.json({ session });
  })
  .post("/:id/review", async (c) => {
    const userId = c.get("userId");
    const session = await sessionsService.markReviewed(c.req.param("id"), userId);
    if (!session) return c.json({ error: "Not found" }, 404);
    return c.json({ session });
  })
  .delete("/:id/review", async (c) => {
    const userId = c.get("userId");
    const session = await sessionsService.reopenReview(c.req.param("id"), userId);
    if (!session) return c.json({ error: "Not found" }, 404);
    return c.json({ session });
  })
  .get("/:sessionId/trade-entries", async (c) => {
    const userId = c.get("userId");
    const sessionId = c.req.param("sessionId");
    const result = await tradeEntriesService.list(sessionId, userId);
    if (!result) return c.json({ error: "Not found" }, 404);
    return c.json({ tradeEntries: result });
  })
  .post(
    "/:sessionId/trade-entries",
    validator("json", (value) => value as CreateTradeEntryInput),
    async (c) => {
      const userId = c.get("userId");
      const sessionId = c.req.param("sessionId");
      const data = c.req.valid("json");
      const tradeEntry = await tradeEntriesService.create(sessionId, userId, data);
      if (!tradeEntry) return c.json({ error: "Not found" }, 404);
      return c.json({ tradeEntry }, 201);
    },
  );

export const sessionsRoutes = app;
export type SessionsRoutes = typeof app;
