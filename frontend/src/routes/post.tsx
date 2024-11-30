import { CommentCard } from "@/components/comment-card";
import { CommentForm } from "@/components/comment-form";
import { MoreReplies } from "@/components/more-creplies";
import { PostCard } from "@/components/post-card";
import { SortBar } from "@/components/sort-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getPost, getPostComments } from "@/lib/api";
import { useUser } from "@/lib/api-hooks";
import { OrderBySchema, SortBySchema } from "@/shared/types";
import {
  infiniteQueryOptions,
  queryOptions,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { fallback, zodSearchValidator } from "@tanstack/router-zod-adapter";
import { useState } from "react";
import { z } from "zod";

const PostSearchSchema = z.object({
  id: fallback(z.number(), 0).default(0),
  sortBy: fallback(SortBySchema, "points").default("points"),
  orderBy: fallback(OrderBySchema, "desc").default("desc"),
});

export const Route = createFileRoute("/post")({
  component: PostComponent,
  validateSearch: zodSearchValidator(PostSearchSchema),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps: { search } }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(postQueryOptions(search.id)),
      context.queryClient.ensureInfiniteQueryData(
        postCommentsInfiniteQueryOptions(search),
      ),
    ]);
  },
});

function PostComponent() {
  const { id, sortBy, orderBy } = Route.useSearch();

  const postQuery = useSuspenseQuery(postQueryOptions(id));
  const post = postQuery.data.data;

  const postCommentsQuery = useSuspenseInfiniteQuery(
    postCommentsInfiniteQueryOptions({ id, sortBy, orderBy }),
  );
  const postComments = postCommentsQuery.data;

  const user = useUser();

  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="sr-only">{post.title}</h1>
      <div className="grid gap-8">
        <PostCard post={post} />
        {user ? (
          <div className="grid gap-4">
            <h2 className="text-lg font-medium">Add Comment</h2>
            <Card>
              <CardContent className="pt-6">
                <CommentForm id={id} />
              </CardContent>
            </Card>
          </div>
        ) : null}
        <div className="grid gap-4">
          <h2 className="text-lg font-medium">Comments</h2>
          <SortBar sortBy={sortBy} orderBy={orderBy} />
          <Card>
            <CardContent>
              {postComments.pages[0].data.length ? (
                <div className="mt-4">
                  {postComments.pages.map((page) =>
                    page.data.map((comment, index) => (
                      <CommentCard
                        key={comment.id}
                        comment={comment}
                        depth={0}
                        activeReplyId={activeReplyId}
                        onActiveReplyIdChange={setActiveReplyId}
                        isLast={index === page.data.length - 1}
                      />
                    )),
                  )}
                </div>
              ) : null}
              {postCommentsQuery.hasNextPage ? (
                <div className="mt-2">
                  <MoreReplies
                    disabled={postCommentsQuery.isFetchingNextPage}
                    onClick={() => {
                      postCommentsQuery.fetchNextPage();
                    }}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function postQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["post", id],
    queryFn: () => getPost(String(id)),
    staleTime: Infinity,
    retry: false,
    throwOnError: true,
  });
}

function postCommentsInfiniteQueryOptions({
  id: postId,
  sortBy,
  orderBy,
}: z.infer<typeof PostSearchSchema>) {
  return infiniteQueryOptions({
    queryKey: ["comments", "post", postId, sortBy, orderBy],
    queryFn: ({ pageParam }) =>
      getPostComments(String(postId), {
        page: pageParam,
        pagination: { sortBy, orderBy },
      }),
    initialPageParam: 1,
    staleTime: Infinity,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.pagination.totalPages <= lastPageParam) {
        return undefined;
      }

      return lastPageParam + 1;
    },
  });
}
