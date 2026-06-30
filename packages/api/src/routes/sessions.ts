import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { sessionsService } from "../services/sessions.js";
import { tradeEntriesService } from "../services/tradeEntries.js";

const app = new Hono<AppEnv>();

app.use(authMiddleware);

app.get("/", async (c) => {
  const userId = c.get("userId");
  const result = await sessionsService.list(userId);
  return c.json({ sessions: result });
});

app.post("/", async (c) => {
  const userId = c.get("userId");
  const session = await sessionsService.create(userId);
  return c.json({ session }, 201);
});

app.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const session = await sessionsService.delete(c.req.param("id"), userId);
  if (!session) return c.json({ error: "Not found" }, 404);
  return c.json({ session });
});

app.get("/:sessionId/trade-entries", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId");
  const result = await tradeEntriesService.list(sessionId, userId);
  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json({ tradeEntries: result });
});

app.post("/:sessionId/trade-entries", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId");
  const data = await c.req.json<{
    result?: "open" | "profit" | "loss" | "breakeven";
    r?: string;
  }>();
  const tradeEntry = await tradeEntriesService.create(sessionId, userId, data);
  if (!tradeEntry) return c.json({ error: "Not found" }, 404);
  return c.json({ tradeEntry }, 201);
});

export const sessionsRoutes = app;
export type SessionsRoutes = typeof app;
