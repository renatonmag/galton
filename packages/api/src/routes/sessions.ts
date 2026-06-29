import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { sessionsService } from "../services/sessions.js";
import { logEntriesService } from "../services/logEntries.js";
import { voiceService } from "../services/voice.js";

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

app.patch("/:id/close", async (c) => {
  const userId = c.get("userId");
  const session = await sessionsService.close(c.req.param("id"), userId);
  if (!session) return c.json({ error: "Not found" }, 404);
  return c.json({ session });
});

app.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const session = await sessionsService.delete(c.req.param("id"), userId);
  if (!session) return c.json({ error: "Not found" }, 404);
  return c.json({ session });
});

app.post("/:sessionId/log-entries/voice", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId");

  const formData = await c.req.formData();
  const audio = formData.get("audio");

  if (!audio || !(audio instanceof File)) {
    return c.json({ error: "audio field required" }, 400);
  }

  try {
    const result = await voiceService.processVoiceEntry(userId, sessionId, audio);
    if (!result) return c.json({ error: "Session not found" }, 404);
    return c.json(result);
  } catch (err) {
    console.error("Voice processing error:", err);
    return c.json({ error: "Voice processing failed" }, 500);
  }
});

app.post("/:sessionId/log-entries", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId");
  const data = await c.req.json<{
    setupId: string;
    decision: "TRADE" | "NO_TRADE";
    result?: "success" | "failure";
    profit?: string;
    loss?: string;
    comment?: string;
    characteristics?: { characteristicId: string; value: string }[];
  }>();
  const logEntry = await logEntriesService.create(sessionId, userId, data);
  if (!logEntry) return c.json({ error: "Not found" }, 404);
  return c.json({ logEntry }, 201);
});

export const sessionsRoutes = app;
export type SessionsRoutes = typeof app;
