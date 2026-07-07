import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { sessionsRoutes } from "./routes/sessions.js";
import { tradeEntriesRoutes } from "./routes/tradeEntries.js";
import { voiceNotesRoutes } from "./routes/voiceNotes.js";
import { statsRoutes } from "./routes/stats.js";
import { userPreferencesRoutes } from "./routes/userPreferences.js";
import { dailyReportsRoutes } from "./routes/dailyReports.js";
import { behaviorInsightsRoutes } from "./routes/behaviorInsights.js";

const app = new Hono()
  .use(logger())
  .get("/", (c) => c.text("Galton API"))
  .route("/sessions", sessionsRoutes)
  .route("/trade-entries", tradeEntriesRoutes)
  .route("/voice-notes", voiceNotesRoutes)
  .route("/stats", statsRoutes)
  .route("/user-preferences", userPreferencesRoutes)
  .route("/reports", dailyReportsRoutes)
  .route("/behavior-insights", behaviorInsightsRoutes);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export type AppType = typeof app;
export default app;
