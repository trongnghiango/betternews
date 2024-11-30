import { PostCard } from "@/components/post-card";
import { SortBar } from "@/components/sort-bar";
import { Button } from "@/components/ui/button";
import { getPosts } from "@/lib/api";
import { OrderBySchema, SortBySchema } from "@/shared/types";
import {
  infiniteQueryOptions,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { fallback, zodSearchValidator } from "@tanstack/router-zod-adapter";
import { z } from "zod";

const HomeSearchSchema = z.object({
  sortBy: fallback(SortBySchema, "points").default("points"),
  orderBy: fallback(OrderBySchema, "desc").default("desc"),
  author: fallback(z.string(), "").optional(),
  site: fallback(z.string(), "").optional(),
});

export const Route = createFileRoute("/")({
  component: HomeComponent,
  validateSearch: zodSearchValidator(HomeSearchSchema),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps: { search } }) => {
    await context.queryClient.ensureInfiniteQueryData(
      postsInfiniteQueryOptions(search),
    );
  },
});

function HomeComponent() {
  const search = Route.useSearch();

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useSuspenseInfiniteQuery(postsInfiniteQueryOptions(search));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Submissions</h1>
      <div className="mt-8 space-y-4">
        <SortBar sortBy={search.sortBy} orderBy={search.orderBy} />
        <div className="space-y-3">
          {data.pages.map((page) =>
            page.data.map((post) => <PostCard key={post.id} post={post} />),
          )}
        </div>
        <div>
          <Button
            size="sm"
            disabled={!hasNextPage || isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage
              ? "Loading more…"
              : hasNextPage
                ? "Load more"
                : "Nothing more to load…"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function postsInfiniteQueryOptions({
  sortBy,
  orderBy,
  author,
  site,
}: z.infer<typeof HomeSearchSchema>) {
  return infiniteQueryOptions({
    queryKey: ["posts", sortBy, orderBy, author, site],
    queryFn: ({ pageParam }) =>
      getPosts({
        page: pageParam,
        pagination: { sortBy, orderBy, author, site },
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
