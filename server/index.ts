import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import type { Context } from "./context";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { commentsRouter } from "./routes/comments";
import { postsRouter } from "./routes/posts";
import { errorHandler, validateAuthSession } from "./utils/middleware";

const app = new Hono<Context>();

app.use("*", cors(), validateAuthSession);

export type ApiRoutes = typeof routes;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .basePath("/api")
  .route("/auth", authRouter)
  .route("/posts", postsRouter)
  .route("/comments", commentsRouter);

app.onError(errorHandler);

app.get("*", serveStatic({ root: "./frontend/dist" }));

export default {
  port: env.PORT,
  hostname: env.HOSTNAME,
  fetch: app.fetch,
};
