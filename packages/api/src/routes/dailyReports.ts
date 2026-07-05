import { Hono } from "hono";
import { DateTime } from "luxon";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { dailyReportsService } from "../services/dailyReports.js";
import { userPreferencesService } from "../services/userPreferences.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const app = new Hono<AppEnv>()
  .use(authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const reportDates = await dailyReportsService.list(userId);
    return c.json({ reportDates });
  })
  .get("/:date", async (c) => {
    const userId = c.get("userId");
    const date = c.req.param("date");
    if (!DATE_PATTERN.test(date) || !DateTime.fromISO(date).isValid) {
      return c.json({ error: "Invalid date" }, 400);
    }

    const preferences = await userPreferencesService.get(userId);
    const timezone = preferences?.timezone ?? "UTC";
    const today = DateTime.now().setZone(timezone).startOf("day");
    if (DateTime.fromISO(date, { zone: timezone }) > today) {
      return c.json({ error: "Cannot generate a report for a future date" }, 400);
    }

    const report = await dailyReportsService.getOrGenerate(userId, date);
    return c.json({ report });
  });

export const dailyReportsRoutes = app;
export type DailyReportsRoutes = typeof app;
