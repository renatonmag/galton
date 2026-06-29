import { Hono } from "hono";
import { logger } from "hono/logger";
import { strategiesRoutes } from "./routes/strategies.js";
import { setupsRoutes } from "./routes/setups.js";
import { characteristicsRoutes } from "./routes/characteristics.js";
import { sessionsRoutes } from "./routes/sessions.js";
import { logEntriesRoutes } from "./routes/logEntries.js";

const app = new Hono();

app.use(logger());

app.get("/", (c) => c.text("Galton API"));
app.route("/strategies", strategiesRoutes);
app.route("/strategies/:strategyId/setups", setupsRoutes);
app.route("/strategies/:strategyId/setups/:setupId/characteristics", characteristicsRoutes);
app.route("/sessions", sessionsRoutes);
app.route("/log-entries", logEntriesRoutes);

export type AppType = typeof app;
export default app;
