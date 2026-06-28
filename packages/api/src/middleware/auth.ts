import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { supabaseAdmin } from "../lib/supabase.js";

export type Variables = { userId: string };
export type AppEnv = { Variables: Variables };

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) throw new HTTPException(401, { message: "Unauthorized" });

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new HTTPException(401, { message: "Unauthorized" });

  c.set("userId", user.id);
  await next();
});
