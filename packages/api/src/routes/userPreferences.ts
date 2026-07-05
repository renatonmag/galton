import { Hono } from "hono";
import { validator } from "hono/validator";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { userPreferencesService } from "../services/userPreferences.js";

type UpsertUserPreferencesInput = {
  notificationTime?: string;
  timezone?: string;
};

const app = new Hono<AppEnv>()
  .use(authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const userPreferences = await userPreferencesService.get(userId);
    return c.json({ userPreferences });
  })
  .put(
    "/",
    validator("json", (value) => value as UpsertUserPreferencesInput),
    async (c) => {
      const userId = c.get("userId");
      const data = c.req.valid("json");
      const userPreferences = await userPreferencesService.upsert(userId, data);
      return c.json({ userPreferences });
    },
  );

export const userPreferencesRoutes = app;
export type UserPreferencesRoutes = typeof app;
