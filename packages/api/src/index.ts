import { Hono } from "hono";
import { strategiesRoutes } from "./routes/strategies.js";

const app = new Hono();

app.get("/", (c) => c.text("Galton API"));
app.route("/strategies", strategiesRoutes);

export type AppType = typeof app;
export default app;
