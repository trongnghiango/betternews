import { useUpvotePostMutation, useUser } from "@/lib/api-hooks";
import { cx, relativeTime } from "@/lib/utils";
import type { Post } from "@/shared/types";
import { Link } from "@tanstack/react-router";
import { ChevronUpIcon } from "lucide-react";
import { badgeVariants } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Toggle } from "./ui/toggle";

export function PostCard({ post }: { post: Post }) {
  return (
    <Card className="flex items-start pl-3 pt-3">
      <PostUpvoteToggle post={post} />
      <div className="grow">
        <CardHeader className="gap-1 px-3 py-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl font-medium">
              {post.url ? (
                <a
                  href={post.url}
                  className="hover:text-primary hover:underline"
                >
                  {post.title}
                </a>
              ) : (
                <Link
                  to="/post"
                  search={{ id: post.id }}
                  className="hover:text-primary hover:underline"
                >
                  {post.title}
                </Link>
              )}
            </CardTitle>
            {post.url ? (
              <Link
                to="/"
                search={{ site: post.url }}
                className={cx(
                  badgeVariants({
                    variant: "secondary",
                  }),
                  "font-normal hover:bg-primary/80 hover:underline",
                )}
              >
                {new URL(post.url).hostname}
              </Link>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-xs/5 text-muted-foreground">
            <p className="whitespace-nowrap">
              by{" "}
              <Link
                to="/"
                search={{ author: post.author.id }}
                className="hover:underline"
              >
                {post.author.username}
              </Link>
            </p>
            <svg
              viewBox="0 0 2 2"
              className="size-0.5 fill-current"
              aria-hidden
            >
              <circle r={1} cx={1} cy={1} />
            </svg>
            <p className="whitespace-nowrap">{relativeTime(post.createdAt)}</p>
            <svg
              viewBox="0 0 2 2"
              className="size-0.5 fill-current"
              aria-hidden
            >
              <circle r={1} cx={1} cy={1} />
            </svg>
            <p className="truncate">
              <Link
                to="/post"
                search={{ id: post.id }}
                className="hover:underline"
              >
                {post.commentCount} comments
              </Link>
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {post.content ? (
            <div className="pt-2 text-sm text-foreground">{post.content}</div>
          ) : null}
        </CardContent>
      </div>
    </Card>
  );
}

function PostUpvoteToggle({
  post,
}: {
  post: Pick<Post, "id" | "isUpvoted" | "points">;
}) {
  const user = useUser();

  const upvotePostMutation = useUpvotePostMutation();

  return (
    <Toggle
      size="sm"
      pressed={post.isUpvoted}
      disabled={!user}
      onClick={() => upvotePostMutation.mutate({ id: post.id })}
      className="h-auto min-w-0 flex-col gap-0 px-0 hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-primary"
      aria-label="Toggle post upvote"
    >
      <ChevronUpIcon />
      <span className="text-xs">{post.points}</span>
    </Toggle>
  );
}
