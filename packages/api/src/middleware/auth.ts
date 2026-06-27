import { createMiddleware } from "hono/factory";
import { jwt } from "hono/jwt";

export type Variables = { userId: string };
export type AppEnv = { Variables: Variables };

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error("SUPABASE_JWT_SECRET is not set");

  await jwt({ secret, alg: "HS256" })(c, async () => {});
  const payload = c.get("jwtPayload") as { sub: string };
  c.set("userId", payload.sub);
  await next();
});
