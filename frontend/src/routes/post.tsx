import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  infiniteQueryOptions,
  queryOptions,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { fallback, zodSearchValidator } from "@tanstack/router-zod-adapter";

import { ChevronDownIcon } from "lucide-react";
import { z } from "zod";

import { OrderBySchema, SortBySchema } from "@/shared/types";
import { getPost, getPostComments } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommentCard } from "@/components/comment-card";
import { PostCard } from "@/components/post-card";
import { SortBar } from "@/components/sort-bar";

const PostSearchSchema = z.object({
  id: fallback(z.number(), 0).default(0),
  sortBy: fallback(SortBySchema, "points").default("points"),
  orderBy: fallback(OrderBySchema, "desc").default("desc"),
});

export const Route = createFileRoute("/post")({
  component: Post,
  validateSearch: zodSearchValidator(PostSearchSchema),
});

function Post() {
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);

  const { id, sortBy, orderBy } = Route.useSearch();

  const postQueryResult = useSuspenseQuery(postQueryOptions(id));

  const postCommentsQueryResult = useSuspenseInfiniteQuery(
    postCommentsInfiniteQueryOptions({ id, sortBy, orderBy }),
  );
  const postComments = postCommentsQueryResult.data;

  return (
    <div className="mx-auto max-w-3xl">
      <PostCard post={postQueryResult.data.data} />
      {postComments.pages[0].data.length ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Comments</CardTitle>
            <SortBar sortBy={sortBy} orderBy={orderBy} />
          </CardHeader>
          <CardContent>
            {postComments.pages.map((page) =>
              page.data.map((comment, index) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  activeReplyId={activeReplyId}
                  onReply={setActiveReplyId}
                  isLast={index === page.data.length - 1}
                />
              )),
            )}
            {postCommentsQueryResult.hasNextPage ? (
              <div className="mt-2">
                <button
                  disabled={postCommentsQueryResult.isFetchingNextPage}
                  onClick={() => {
                    postCommentsQueryResult.fetchNextPage();
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDownIcon size={12} />
                  {postCommentsQueryResult.isFetchingNextPage
                    ? "Loading…"
                    : "More replies"}
                </button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
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
