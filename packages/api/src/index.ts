import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { sessionsRoutes } from "./routes/sessions.js";
import { tradeEntriesRoutes } from "./routes/tradeEntries.js";
import { statsRoutes } from "./routes/stats.js";

const app = new Hono();

app.use(logger());

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.get("/", (c) => c.text("Galton API"));
app.route("/sessions", sessionsRoutes);
app.route("/trade-entries", tradeEntriesRoutes);
app.route("/stats", statsRoutes);

export type AppType = typeof app;
export default app;
