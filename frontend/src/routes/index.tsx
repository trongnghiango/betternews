import { createFileRoute } from "@tanstack/react-router";
import {
  infiniteQueryOptions,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { fallback, zodSearchValidator } from "@tanstack/router-zod-adapter";

import { z } from "zod";

import { OrderBySchema, SortBySchema } from "@/shared/types";
import { getPosts } from "@/lib/api";
import { useUpvotePostMutation } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { SortBar } from "@/components/sort-bar";

const HomeSearchSchema = z.object({
  sortBy: fallback(SortBySchema, "points").default("points"),
  orderBy: fallback(OrderBySchema, "desc").default("desc"),
  author: fallback(z.string(), "").optional(),
  site: fallback(z.string(), "").optional(),
});

function postsInfiniteQueryOptions({
  sortBy,
  orderBy,
  author,
  site,
}: z.infer<typeof HomeSearchSchema>) {
  return infiniteQueryOptions({
    queryKey: ["posts", sortBy, orderBy, author, site],
    queryFn: ({ pageParam }) =>
      getPosts({ pageParam, pagination: { sortBy, orderBy, author, site } }),
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

export const Route = createFileRoute("/")({
  component: HomeComponent,
  validateSearch: zodSearchValidator(HomeSearchSchema),
});

function HomeComponent() {
  const { sortBy, orderBy, author, site } = Route.useSearch();

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useSuspenseInfiniteQuery(
      postsInfiniteQueryOptions({ sortBy, orderBy, author, site }),
    );

  const upvotePostMutation = useUpvotePostMutation();

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Submissions</h1>
      <SortBar sortBy={sortBy} orderBy={orderBy} />
      <div className="space-y-4">
        {data.pages.map((page) =>
          page.data.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpvote={() => upvotePostMutation.mutate(post.id.toString())}
            />
          )),
        )}
      </div>
      <div className="mt-6">
        <Button
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetchingNextPage}
        >
          {isFetchingNextPage
            ? "Loading more…"
            : hasNextPage
              ? "Load more"
              : "Nothing more to load…"}
        </Button>
      </div>
    </div>
  );
}
