import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { and, asc, countDistinct, desc, eq, sql } from "drizzle-orm";

import { db } from "@/adapter";
import type { Context } from "@/context";
import { commentsTable } from "@/db/schemas/comments";
import { postsTable } from "@/db/schemas/posts";
import { commentUpvotesTable } from "@/db/schemas/upvotes";
import { loggedIn } from "@/middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import {
  CreateCommentSchema,
  PaginationSchema,
  type Comment,
  type SuccessResponse,
  type SuccessResponseWithPagination,
} from "@/shared/types";
import { getISOFormatDateQuery } from "@/lib/utils";

export const commentsRouter = new Hono<Context>()
  .post(
    "/:id",
    loggedIn,
    zValidator("param", z.object({ id: z.coerce.number() })),
    zValidator("form", CreateCommentSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");
      const { content } = c.req.valid("form");

      const [comment] = await db.transaction(async (tx) => {
        const [updatedParentComment] = await tx
          .update(commentsTable)
          .set({ commentCount: sql`${commentsTable.commentCount} + 1` })
          .where(eq(commentsTable.id, id))
          .returning({
            postId: commentsTable.postId,
            depth: commentsTable.depth,
            commentCount: commentsTable.commentCount,
          });
        if (!updatedParentComment) {
          throw new HTTPException(404, { message: "Comment not found" });
        }

        const [updatedPost] = await tx
          .update(postsTable)
          .set({ commentCount: sql`${postsTable.commentCount} + 1` })
          .where(eq(postsTable.id, updatedParentComment.postId))
          .returning({ commentCount: postsTable.commentCount });
        if (!updatedPost) {
          throw new HTTPException(404, {
            message: "Comment post not found",
          });
        }

        return await tx
          .insert(commentsTable)
          .values({
            userId: user.id,
            postId: updatedParentComment.postId,
            parentCommentId: id,
            content,
            depth: updatedParentComment.depth + 1,
          })
          .returning({
            id: commentsTable.id,
            userId: commentsTable.userId,
            postId: commentsTable.postId,
            parentCommentId: commentsTable.parentCommentId,
            content: commentsTable.content,
            createdAt: getISOFormatDateQuery(commentsTable.createdAt).as(
              "created_at",
            ),
            depth: commentsTable.depth,
            commentCount: commentsTable.commentCount,
            points: commentsTable.points,
          });
      });

      return c.json<SuccessResponse<Comment>>({
        success: true,
        message: "Comment created",
        data: {
          ...comment,
          commentUpvotes: [],
          author: { id: user.id, username: user.username },
          childComments: [],
        },
      });
    },
  )
  .get(
    "/:id/comments",
    zValidator("param", z.object({ id: z.coerce.number() })),
    zValidator("query", PaginationSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");
      const { limit, page, sortBy, orderBy } = c.req.valid("query");

      const offset = (page - 1) * limit;
      const sortByColumn =
        sortBy === "points" ? commentsTable.points : commentsTable.createdAt;
      const sortOrder =
        orderBy === "desc" ? desc(sortByColumn) : asc(sortByColumn);

      const [count] = await db
        .select({ count: countDistinct(commentsTable.id) })
        .from(commentsTable)
        .where(eq(commentsTable.parentCommentId, id));

      const comments = await db.query.comments.findMany({
        where: eq(commentsTable.parentCommentId, id),
        limit,
        offset,
        orderBy: sortOrder,
        with: {
          author: {
            columns: {
              id: true,
              username: true,
            },
          },
          commentUpvotes: {
            where: eq(commentUpvotesTable.userId, user?.id ?? ""),
            limit: 1,
            columns: { userId: true },
          },
        },
        extras: {
          createdAt: getISOFormatDateQuery(commentsTable.createdAt).as(
            "created_at",
          ),
        },
      });

      return c.json<SuccessResponseWithPagination<Comment[]>>(
        {
          success: true,
          message: "Comments fetched",
          data: comments,
          pagination: {
            page,
            totalPages: Math.ceil(count.count / limit),
          },
        },
        200,
      );
    },
  )
  .patch(
    "/:id/upvote",
    loggedIn,
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");

      let pointsChange: -1 | 1 = 1;

      const points = await db.transaction(async (tx) => {
        const [existingUpvote] = await tx
          .select()
          .from(commentUpvotesTable)
          .where(
            and(
              eq(commentUpvotesTable.commentId, id),
              eq(commentUpvotesTable.userId, user.id),
            ),
          )
          .limit(1);

        pointsChange = existingUpvote ? -1 : 1;

        const [updated] = await tx
          .update(commentsTable)
          .set({
            points: sql`${commentsTable.points} + ${pointsChange}`,
          })
          .where(eq(commentsTable.id, id))
          .returning({ points: commentsTable.points });
        if (!updated) {
          throw new HTTPException(404, { message: "Comment not found" });
        }

        if (existingUpvote) {
          await tx
            .delete(commentUpvotesTable)
            .where(eq(commentUpvotesTable.id, existingUpvote.id));
        } else {
          await tx
            .insert(commentUpvotesTable)
            .values({ commentId: id, userId: user.id });
        }

        return updated.points;
      });

      const isUpvoted = pointsChange === 1;

      return c.json<
        SuccessResponse<{ count: number; commentUpvotes: { userId: string }[] }>
      >(
        {
          success: true,
          message: "Comment updated",
          data: {
            count: points,
            commentUpvotes: isUpvoted ? [{ userId: user.id }] : [],
          },
        },
        200,
      );
    },
  );
