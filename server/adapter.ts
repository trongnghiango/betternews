import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import {
  commentsRelations,
  commentsTable,
  commentUpvotesRelations,
  commentUpvotesTable,
  postsRelations,
  postsTable,
  postUpvotesRelations,
  postUpvotesTable,
  sessionTable,
  userTable,
} from "./db/schema";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const processEnv = EnvSchema.parse(process.env);

const queryClient = postgres(processEnv.DATABASE_URL);
export const db = drizzle(queryClient, {
  schema: {
    user: userTable,
    session: sessionTable,
    posts: postsTable,
    postsRelations,
    comments: commentsTable,
    commentsRelations,
    postUpvotes: postUpvotesTable,
    postUpvotesRelations,
    commentUpvotes: commentUpvotesTable,
    commentUpvotesRelations,
  },
});

export const adapter = new DrizzlePostgreSQLAdapter(
  db,
  sessionTable,
  userTable,
);
