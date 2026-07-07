import { Hono } from "hono";
import { validator } from "hono/validator";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { sessionsService } from "../services/sessions.js";
import { tradeEntriesService } from "../services/tradeEntries.js";
import { transcriptionService } from "../services/transcription.js";
import { voiceNotesService } from "../services/voiceNotes.js";

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
  )
  .get("/:sessionId/voice-notes", async (c) => {
    const userId = c.get("userId");
    const sessionId = c.req.param("sessionId");
    const result = await voiceNotesService.list(sessionId, userId);
    if (!result) return c.json({ error: "Not found" }, 404);
    return c.json({ voiceNotes: result });
  })
  .post("/:sessionId/voice-notes", async (c) => {
    const userId = c.get("userId");
    const sessionId = c.req.param("sessionId");

    const formData = await c.req.formData();
    const audio = formData.get("audio");
    if (!audio || !(audio instanceof File)) {
      return c.json({ error: "audio field required" }, 400);
    }

    try {
      const text = await transcriptionService.transcribeAudio(audio);
      const transcript = text.trim();
      if (!transcript) {
        return c.json({ error: "No speech detected" }, 422);
      }
      const voiceNote = await voiceNotesService.create(sessionId, userId, transcript);
      if (!voiceNote) return c.json({ error: "Not found" }, 404);
      return c.json({ voiceNote }, 201);
    } catch (err) {
      console.error("Transcription error:", err);
      return c.json({ error: "Transcription failed" }, 500);
    }
  });

export const sessionsRoutes = app;
export type SessionsRoutes = typeof app;
