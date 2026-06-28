import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { setupsService } from "../services/setups.js";

const app = new Hono<AppEnv>();

app.use(authMiddleware);

app.get("/", async (c) => {
  const userId = c.get("userId");
  const strategyId = c.req.param("strategyId");
  const result = await setupsService.list(strategyId, userId);
  return c.json({ setups: result });
});

app.post("/", async (c) => {
  const userId = c.get("userId");
  const strategyId = c.req.param("strategyId");
  const { name, description } = await c.req.json<{
    name: string;
    description?: string;
  }>();
  const setup = await setupsService.create(strategyId, userId, name, description);
  if (!setup) return c.json({ error: "Not found" }, 404);
  return c.json({ setup }, 201);
});

app.get("/:id", async (c) => {
  const userId = c.get("userId");
  const strategyId = c.req.param("strategyId");
  const setup = await setupsService.get(c.req.param("id"), strategyId, userId);
  if (!setup) return c.json({ error: "Not found" }, 404);
  return c.json({ setup });
});

app.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const strategyId = c.req.param("strategyId");
  const data = await c.req.json<{ name?: string; description?: string }>();
  const setup = await setupsService.update(
    c.req.param("id"),
    strategyId,
    userId,
    data,
  );
  if (!setup) return c.json({ error: "Not found" }, 404);
  return c.json({ setup });
});

app.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const strategyId = c.req.param("strategyId");
  const deleted = await setupsService.remove(
    c.req.param("id"),
    strategyId,
    userId,
  );
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return new Response(null, { status: 204 });
});

export const setupsRoutes = app;
export type SetupsRoutes = typeof app;
