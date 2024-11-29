import { env } from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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
} from "../db/schema";

const queryClient = postgres(env.DATABASE_URL);

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
