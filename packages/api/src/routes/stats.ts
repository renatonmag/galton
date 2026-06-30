import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { statsService } from "../services/stats.js";

const app = new Hono<AppEnv>();

app.use(authMiddleware);

app.get("/", async (c) => {
  const userId = c.get("userId");
  const stats = await statsService.get(userId);
  return c.json(stats);
});

export const statsRoutes = app;
export type StatsRoutes = typeof app;
