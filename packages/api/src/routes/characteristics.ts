import { Hono } from "hono";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { characteristicsService } from "../services/characteristics.js";

const app = new Hono<AppEnv>();

app.use(authMiddleware);

app.get("/", async (c) => {
  const userId = c.get("userId");
  const setupId = c.req.param("setupId");
  const strategyId = c.req.param("strategyId");
  const result = await characteristicsService.list(setupId, strategyId, userId);
  return c.json({ characteristics: result });
});

app.post("/", async (c) => {
  const userId = c.get("userId");
  const setupId = c.req.param("setupId");
  const strategyId = c.req.param("strategyId");
  const body = await c.req.json<{
    name: string;
    type: "boolean" | "multiple_choice";
    options?: string[];
    position: number;
  }>();
  const characteristic = await characteristicsService.create(setupId, strategyId, userId, body);
  if (!characteristic) return c.json({ error: "Not found" }, 404);
  return c.json({ characteristic }, 201);
});

app.get("/:id", async (c) => {
  const userId = c.get("userId");
  const setupId = c.req.param("setupId");
  const strategyId = c.req.param("strategyId");
  const characteristic = await characteristicsService.get(
    c.req.param("id"),
    setupId,
    strategyId,
    userId,
  );
  if (!characteristic) return c.json({ error: "Not found" }, 404);
  return c.json({ characteristic });
});

app.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const setupId = c.req.param("setupId");
  const strategyId = c.req.param("strategyId");
  const data = await c.req.json<{
    name?: string;
    type?: "boolean" | "multiple_choice";
    options?: string[];
    position?: number;
  }>();
  const characteristic = await characteristicsService.update(
    c.req.param("id"),
    setupId,
    strategyId,
    userId,
    data,
  );
  if (!characteristic) return c.json({ error: "Not found" }, 404);
  return c.json({ characteristic });
});

app.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const setupId = c.req.param("setupId");
  const strategyId = c.req.param("strategyId");
  const deleted = await characteristicsService.remove(
    c.req.param("id"),
    setupId,
    strategyId,
    userId,
  );
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return new Response(null, { status: 204 });
});

export const characteristicsRoutes = app;
export type CharacteristicsRoutes = typeof app;
