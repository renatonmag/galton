import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { logEntriesService } from "../services/logEntries.js";

const app = new Hono<AppEnv>();

app.use(authMiddleware);

app.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const data = await c.req.json<{
    result?: "success" | "failure" | null;
    profit?: string | null;
    loss?: string | null;
    comment?: string | null;
    createdAt?: string;
    characteristics?: { characteristicId: string; value: string }[];
  }>();
  const logEntry = await logEntriesService.update(c.req.param("id"), userId, data);
  if (!logEntry) return c.json({ error: "Not found" }, 404);
  return c.json({ logEntry });
});

export const logEntriesRoutes = app;
export type LogEntriesRoutes = typeof app;
