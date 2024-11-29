import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";

export const userTable = table("user", {
  id: t.text("id").primaryKey(),
  username: t.text("username").notNull().unique(),
  passwordHash: t.text("password_hash").notNull(),
});

export const userRatlations = relations(userTable, ({ many }) => ({
  posts: many(postsTable, { relationName: "author" }),
  comments: many(commentsTable, { relationName: "author" }),
  postUpvotes: many(postUpvotesTable, { relationName: "user" }),
  commentUpvotes: many(commentUpvotesTable, { relationName: "user" }),
}));

export const sessionTable = table("session", {
  id: t.text("id").primaryKey(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: t
    .timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    })
    .notNull(),
});

export const postsTable = table("posts", {
  id: t.serial("id").primaryKey(),
  userId: t.text("user_id").notNull(),
  title: t.text("title").notNull(),
  url: t.text("url"),
  content: t.text("content"),
  points: t.integer("points").default(0).notNull(),
  commentCount: t.integer("comment_count").default(0).notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const postsRelations = relations(postsTable, ({ one, many }) => ({
  author: one(userTable, {
    fields: [postsTable.userId],
    references: [userTable.id],
    relationName: "author",
  }),
  postUpvotes: many(postUpvotesTable, { relationName: "postUpvotes" }),
  comments: many(commentsTable),
}));

export const postUpvotesTable = table("post_upvotes", {
  id: t.serial("id").primaryKey(),
  postId: t.integer("post_id").notNull(),
  userId: t.text("user_id").notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const postUpvotesRelations = relations(postUpvotesTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [postUpvotesTable.postId],
    references: [postsTable.id],
    relationName: "postUpvotes",
  }),
  user: one(userTable, {
    fields: [postUpvotesTable.userId],
    references: [userTable.id],
    relationName: "user",
  }),
}));

export const commentsTable = table("comments", {
  id: t.serial("id").primaryKey(),
  userId: t.text("user_id").notNull(),
  postId: t.integer("post_id").notNull(),
  parentCommentId: t.integer("parent_comment_id"),
  content: t.text("content").notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  depth: t.integer("depth").default(0).notNull(),
  commentCount: t.integer("comment_count").default(0).notNull(),
  points: t.integer("points").default(0).notNull(),
});

export const commentsRelations = relations(commentsTable, ({ one, many }) => ({
  author: one(userTable, {
    fields: [commentsTable.userId],
    references: [userTable.id],
    relationName: "author",
  }),
  parentComment: one(commentsTable, {
    fields: [commentsTable.parentCommentId],
    references: [commentsTable.id],
    relationName: "childComments",
  }),
  childComments: many(commentsTable, {
    relationName: "childComments",
  }),
  post: one(postsTable, {
    fields: [commentsTable.postId],
    references: [postsTable.id],
  }),
  commentUpvotes: many(commentUpvotesTable, { relationName: "commentUpvotes" }),
}));

export const commentUpvotesTable = table("comment_upvotes", {
  id: t.serial("id").primaryKey(),
  commentId: t.integer("comment_id").notNull(),
  userId: t.text("user_id").notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const commentUpvotesRelations = relations(
  commentUpvotesTable,
  ({ one }) => ({
    comment: one(commentsTable, {
      fields: [commentUpvotesTable.commentId],
      references: [commentsTable.id],
      relationName: "commentUpvotes",
    }),
    user: one(userTable, {
      fields: [commentUpvotesTable.userId],
      references: [userTable.id],
      relationName: "user",
    }),
  }),
);
