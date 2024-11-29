import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { commentsTable, postsTable } from "../server/db/schema";

export type { ApiRoutes } from "../server/index";

/**
 * @example
 * ```ts
 * const data: SuccessResponse<{ id: number }> = {
 *   success: true,
 *   message: "Post created",
 *   data: { id: 1 },
 * };
 * ```
 */
export type SuccessResponse<T = void> = {
  success: true;
  message: string;
} & (T extends void ? {} : { data: T });

/**
 * @example
 * ```ts
 * const data: SuccessResponseWithPagination<{ id: number }> = {
 *   success: true,
 *   message: "Post created",
 *   data: { id: 1 },
 *   pagination: {
 *     page: 1,
 *     totalPages: 6
 *   }
 * };
 * ```
 */
export type SuccessResponseWithPagination<T> = {
  pagination: {
    page: number;
    totalPages: number;
  };
} & SuccessResponse<T>;

export type ErrorResponse = {
  success: false;
  error: string;
  isFormError?: boolean;
};

export type Post = {
  id: number;
  title: string;
  url: string | null;
  content: string | null;
  points: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
  };
  isUpvoted: boolean;
};

export type Comment = {
  id: number;
  userId: string;
  content: string;
  points: number;
  commentCount: number;
  createdAt: string;
  postId: number;
  parentCommentId: number | null;
  depth: number;
  commentUpvotes: { userId: string }[];
  author: { id: string; username: string };
  childComments?: Comment[];
};

export const LoginSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(31)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(3).max(255),
});

export const InsertPostSchema = createInsertSchema(postsTable, {
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" }),
  url: z
    .string()
    .trim()
    .url({ message: "URL must be valid" })
    .optional()
    .or(z.literal("")),
  content: z.string().optional(),
});

export const CreatePostSchema = InsertPostSchema.pick({
  title: true,
  url: true,
  content: true,
}).refine((data) => data.url || data.content, {
  message: "Either URL or Content must be provided",
  path: ["url", "content"],
});

export const InsertCommentSchema = createInsertSchema(commentsTable, {
  content: z
    .string()
    .min(3, { message: "Content must be at least 3 characters long" }),
});

export const CreateCommentSchema = InsertCommentSchema.pick({ content: true });

export type SortBy = z.infer<typeof SortBySchema>;
export const SortBySchema = z.enum(["points", "recent"]);

export type OrderBy = z.infer<typeof OrderBySchema>;
export const OrderBySchema = z.enum(["asc", "desc"]);

export const PaginationSchema = z.object({
  limit: z.coerce.number().optional().default(10),
  page: z.coerce.number().optional().default(1),
  sortBy: SortBySchema.optional().default("points"),
  orderBy: OrderBySchema.optional().default("desc"),
  author: z.string().optional(),
  site: z.string().optional(),
});
