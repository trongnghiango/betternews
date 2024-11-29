import { db } from "@/adapter";
import type { Context } from "@/context";
import { userTable } from "@/db/schemas/auth";
import { commentsTable } from "@/db/schemas/comments";
import { postsTable } from "@/db/schemas/posts";
import { commentUpvotesTable, postUpvotesTable } from "@/db/schemas/upvotes";
import { getISOFormatDateQuery } from "@/lib/utils";
import { loggedIn } from "@/middleware";
import {
  CreateCommentSchema,
  CreatePostSchema,
  PaginationSchema,
  type Comment,
  type Post,
  type SuccessResponse,
  type SuccessResponseWithPagination,
} from "@/shared/types";
import { zValidator } from "@hono/zod-validator";
import { and, asc, countDistinct, desc, eq, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

export const postsRouter = new Hono<Context>()
  .post("/", loggedIn, zValidator("form", CreatePostSchema), async (c) => {
    const user = c.get("user")!;
    const { title, url, content } = c.req.valid("form");

    const [post] = await db
      .insert(postsTable)
      .values({
        title,
        url,
        content,
        userId: user.id,
      })
      .returning({ id: postsTable.id });

    return c.json<SuccessResponse<{ postId: number }>>(
      {
        success: true,
        message: "Post created",
        data: { postId: post.id },
      },
      201,
    );
  })
  .post(
    "/:id/comment",
    loggedIn,
    zValidator("param", z.object({ id: z.coerce.number() })),
    zValidator("form", CreateCommentSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");
      const { content } = c.req.valid("form");

      const [comment] = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(postsTable)
          .set({ commentCount: sql`${postsTable.commentCount} + 1` })
          .where(eq(postsTable.id, id))
          .returning({ commentCount: postsTable.commentCount });
        if (!updated) {
          throw new HTTPException(404, { message: "Post not found" });
        }

        return await tx
          .insert(commentsTable)
          .values({ userId: user.id, postId: id, content })
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
  .get("/", zValidator("query", PaginationSchema), async (c) => {
    const user = c.get("user");
    const { limit, page, sortBy, orderBy, author, site } = c.req.valid("query");

    const offset = (page - 1) * limit;
    const sortByColumn =
      sortBy === "points" ? postsTable.points : postsTable.createdAt;
    const sortOrder =
      orderBy === "desc" ? desc(sortByColumn) : asc(sortByColumn);

    const [count] = await db
      .select({ count: countDistinct(postsTable.id) })
      .from(postsTable)
      .where(
        and(
          author ? eq(postsTable.userId, author) : undefined,
          site ? eq(postsTable.url, site) : undefined,
        ),
      );

    const postsQuery = db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        url: postsTable.url,
        points: postsTable.points,
        commentCount: postsTable.commentCount,
        createdAt: getISOFormatDateQuery(postsTable.createdAt),
        author: {
          id: userTable.id,
          username: userTable.username,
        },
        isUpvoted: user
          ? sql`CASE WHEN ${postUpvotesTable.userId} IS NOT NULL THEN true ELSE false END`
          : sql`false`,
      })
      .from(postsTable)
      .leftJoin(userTable, eq(postsTable.userId, userTable.id))
      .limit(limit)
      .offset(offset)
      .orderBy(sortOrder)
      .where(
        and(
          author ? eq(postsTable.userId, author) : undefined,
          site ? eq(postsTable.url, site) : undefined,
        ),
      );

    if (user) {
      postsQuery.leftJoin(
        postUpvotesTable,
        and(
          eq(postUpvotesTable.postId, postsTable.id),
          eq(postUpvotesTable.userId, user.id),
        ),
      );
    }

    const posts = await postsQuery;

    return c.json<SuccessResponseWithPagination<Post[]>>(
      {
        success: true,
        message: "Posts fetched",
        data: posts as Post[],
        pagination: {
          page,
          totalPages: Math.ceil(count.count / limit),
        },
      },
      200,
    );
  })
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const user = c.get("user");
      const { id } = c.req.valid("param");

      const postsQuery = db
        .select({
          id: postsTable.id,
          title: postsTable.title,
          url: postsTable.url,
          content: postsTable.content,
          points: postsTable.points,
          commentCount: postsTable.commentCount,
          createdAt: getISOFormatDateQuery(postsTable.createdAt),
          author: {
            id: userTable.id,
            username: userTable.username,
          },
          isUpvoted: user
            ? sql`CASE WHEN ${postUpvotesTable.userId} IS NOT NULL THEN true ELSE false END`
            : sql`false`,
        })
        .from(postsTable)
        .leftJoin(userTable, eq(postsTable.userId, userTable.id))
        .where(eq(postsTable.id, id));

      if (user) {
        postsQuery.leftJoin(
          postUpvotesTable,
          and(
            eq(postUpvotesTable.postId, postsTable.id),
            eq(postUpvotesTable.userId, user.id),
          ),
        );
      }

      const [post] = await postsQuery;
      if (!post) {
        throw new HTTPException(404, { message: "Post not found" });
      }

      return c.json<SuccessResponse<Post>>(
        {
          success: true,
          message: "Post fetched",
          data: post as Post,
        },
        200,
      );
    },
  )
  .get(
    "/:id/comments",
    zValidator("param", z.object({ id: z.coerce.number() })),
    zValidator(
      "query",
      PaginationSchema.extend({
        includeChildren: z.coerce.boolean().optional(),
      }),
    ),
    async (c) => {
      const user = c.get("user");
      const { id } = c.req.valid("param");
      const { limit, page, sortBy, orderBy, includeChildren } =
        c.req.valid("query");

      const offset = (page - 1) * limit;
      const sortByColumn =
        sortBy === "points" ? commentsTable.points : commentsTable.createdAt;
      const sortOrder =
        orderBy === "desc" ? desc(sortByColumn) : asc(sortByColumn);

      const [postExists] = await db
        .select({ exists: sql`1` })
        .from(postsTable)
        .where(eq(postsTable.id, id))
        .limit(1);
      if (!postExists) {
        throw new HTTPException(404, { message: "Post not found" });
      }

      const [count] = await db
        .select({ count: countDistinct(commentsTable.id) })
        .from(commentsTable)
        .where(
          and(
            eq(commentsTable.postId, id),
            isNull(commentsTable.parentCommentId),
          ),
        );

      const comments = await db.query.comments.findMany({
        where: and(
          eq(commentsTable.postId, id),
          isNull(commentsTable.parentCommentId),
        ),
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
          childComments: {
            limit: includeChildren ? 2 : 0,
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
          .from(postUpvotesTable)
          .where(
            and(
              eq(postUpvotesTable.postId, id),
              eq(postUpvotesTable.userId, user.id),
            ),
          )
          .limit(1);

        pointsChange = existingUpvote ? -1 : 1;

        const [updated] = await tx
          .update(postsTable)
          .set({ points: sql`${postsTable.points} + ${pointsChange}` })
          .where(eq(postsTable.id, id))
          .returning({ points: postsTable.points });
        if (!updated) {
          throw new HTTPException(404, { message: "Post not found" });
        }

        if (existingUpvote) {
          await tx
            .delete(postUpvotesTable)
            .where(eq(postUpvotesTable.id, existingUpvote.id));
        } else {
          await tx
            .insert(postUpvotesTable)
            .values({ postId: id, userId: user.id });
        }

        return updated.points;
      });

      const isUpvoted = pointsChange > 0;

      return c.json<SuccessResponse<{ count: number; isUpvoted: boolean }>>(
        {
          success: true,
          message: "Post updated",
          data: { count: points, isUpvoted },
        },
        200,
      );
    },
  );
