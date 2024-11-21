import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { fallback, zodSearchValidator } from "@tanstack/router-zod-adapter";

import { z } from "zod";

import { OrderBySchema, SortBySchema } from "@/shared/types";
import { getPost } from "@/lib/api";
import { useUpvotePostMutation } from "@/lib/api-hooks";
import { PostCard } from "@/components/post-card";

const PostSearchSchema = z.object({
  id: fallback(z.number(), 0).default(0),
  sortBy: fallback(SortBySchema, "points").default("points"),
  orderBy: fallback(OrderBySchema, "desc").default("desc"),
});

function postQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["post", id],
    queryFn: () => getPost(String(id)),
    staleTime: Infinity,
    retry: false,
    throwOnError: true,
  });
}

export const Route = createFileRoute("/post")({
  component: Post,
  validateSearch: zodSearchValidator(PostSearchSchema),
});

function Post() {
  const { id } = Route.useSearch();

  const { data } = useSuspenseQuery(postQueryOptions(id));

  const upvotePostMutation = useUpvotePostMutation();

  return (
    <div className="mx-auto max-w-3xl">
      <PostCard
        post={data.data}
        onUpvote={() => upvotePostMutation.mutate(String(data.data.id))}
      />
    </div>
  );
}
