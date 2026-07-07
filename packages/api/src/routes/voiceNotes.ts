import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { voiceNotesService } from "../services/voiceNotes.js";

const app = new Hono<AppEnv>().use(authMiddleware).delete("/:id", async (c) => {
  const userId = c.get("userId");
  const voiceNote = await voiceNotesService.remove(c.req.param("id"), userId);
  if (!voiceNote) return c.json({ error: "Not found" }, 404);
  return c.json({ voiceNote });
});

export const voiceNotesRoutes = app;
export type VoiceNotesRoutes = typeof app;
