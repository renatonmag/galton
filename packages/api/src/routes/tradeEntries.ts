import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { tradeEntriesService } from "../services/tradeEntries.js";

const app = new Hono<AppEnv>();

app.use(authMiddleware);

app.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const data = await c.req.json<{
    result?: "open" | "profit" | "loss" | "breakeven";
    r?: string;
    entryAt?: string | null;
  }>();
  const tradeEntry = await tradeEntriesService.update(c.req.param("id"), userId, data);
  if (!tradeEntry) return c.json({ error: "Not found" }, 404);
  return c.json({ tradeEntry });
});

app.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const tradeEntry = await tradeEntriesService.remove(c.req.param("id"), userId);
  if (!tradeEntry) return c.json({ error: "Not found" }, 404);
  return c.json({ tradeEntry });
});

export const tradeEntriesRoutes = app;
export type TradeEntriesRoutes = typeof app;
