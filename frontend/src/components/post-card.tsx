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
    <Card className="flex pl-2 pt-2.5">
      <PostUpvoteToggle post={post} />
      <div className="grid grow gap-1">
        <CardHeader className="px-3 pb-0 pt-0.5">
          <div className="inline-flex flex-wrap items-center gap-2">
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
                  "font-normal hover:bg-primary/80",
                )}
              >
                {new URL(post.url).hostname}
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <span>
              by{" "}
              <Link
                to="/"
                search={{ author: post.author.id }}
                className="hover:underline"
              >
                {post.author.username}
              </Link>
            </span>
            <span aria-hidden>&middot;</span>
            <span>{relativeTime(post.createdAt)}</span>
            <span aria-hidden>&middot;</span>
            <Link
              to="/post"
              search={{ id: post.id }}
              className="hover:underline"
            >
              {post.commentCount} comments
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
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
      pressed={post.isUpvoted}
      disabled={!user}
      onClick={() => upvotePostMutation.mutate(String(post.id))}
      className="h-11 min-w-8 flex-col gap-0.5 data-[state=on]:bg-transparent data-[state=on]:text-primary data-[state=on]:hover:bg-muted"
      aria-label="Toggle upvote"
    >
      <ChevronUpIcon />
      <span className="text-xs">{post.points}</span>
    </Toggle>
  );
}
