import { Hono } from "hono";
import { validator } from "hono/validator";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { tradeEntriesService } from "../services/tradeEntries.js";
import { transcriptionService } from "../services/transcription.js";

type UpdateTradeEntryInput = {
  result?: "open" | "profit" | "loss" | "breakeven";
  direction?: "buy" | "sell" | null;
  r?: string;
  entryAt?: string | null;
  comment?: string | null;
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
  })
  .post("/:id/comment", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const formData = await c.req.formData();
    const audio = formData.get("audio");
    if (!audio || !(audio instanceof File)) {
      return c.json({ error: "audio field required" }, 400);
    }

    try {
      const text = await transcriptionService.transcribeAudio(audio);
      const tradeEntry = await tradeEntriesService.appendComment(id, userId, text);
      if (!tradeEntry) return c.json({ error: "Not found" }, 404);
      return c.json({ tradeEntry });
    } catch (err) {
      console.error("Transcription error:", err);
      return c.json({ error: "Transcription failed" }, 500);
    }
  });

export const tradeEntriesRoutes = app;
export type TradeEntriesRoutes = typeof app;
