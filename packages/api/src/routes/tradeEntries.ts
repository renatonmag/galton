import { Hono } from "hono";
import { validator } from "hono/validator";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { tradeEntriesService } from "../services/tradeEntries.js";

type UpdateTradeEntryInput = {
  result?: "open" | "profit" | "loss" | "breakeven";
  r?: string;
  entryAt?: string | null;
};

const app = new Hono<AppEnv>()
  .use(authMiddleware)
  .patch(
    "/:id",
    validator("json", (value) => value as UpdateTradeEntryInput),
    async (c) => {
      const userId = c.get("userId");
      const data = c.req.valid("json");
      const tradeEntry = await tradeEntriesService.update(c.req.param("id"), userId, data);
      if (!tradeEntry) return c.json({ error: "Not found" }, 404);
      return c.json({ tradeEntry });
    },
  )
  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const tradeEntry = await tradeEntriesService.remove(c.req.param("id"), userId);
    if (!tradeEntry) return c.json({ error: "Not found" }, 404);
    return c.json({ tradeEntry });
  });

export const tradeEntriesRoutes = app;
export type TradeEntriesRoutes = typeof app;
