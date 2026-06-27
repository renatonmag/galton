import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { strategiesService } from "../services/strategies.js";

const app = new Hono<AppEnv>();

app.use(authMiddleware);

app.get("/", async (c) => {
  const userId = c.get("userId");
  const result = await strategiesService.list(userId);
  return c.json({ strategies: result });
});

app.post("/", async (c) => {
  const userId = c.get("userId");
  const { name } = await c.req.json<{ name: string }>();
  const strategy = await strategiesService.create(userId, name);
  return c.json({ strategy }, 201);
});

app.get("/:id", async (c) => {
  const userId = c.get("userId");
  const strategy = await strategiesService.get(c.req.param("id"), userId);
  if (!strategy) return c.json({ error: "Not found" }, 404);
  return c.json({ strategy });
});

app.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const { name } = await c.req.json<{ name: string }>();
  const strategy = await strategiesService.update(c.req.param("id"), userId, name);
  if (!strategy) return c.json({ error: "Not found" }, 404);
  return c.json({ strategy });
});

app.delete("/:id", async (c) => {
  const userId = c.get("userId");
  await strategiesService.remove(c.req.param("id"), userId);
  return new Response(null, { status: 204 });
});

export const strategiesRoutes = app;
export type StrategiesRoutes = typeof app;
