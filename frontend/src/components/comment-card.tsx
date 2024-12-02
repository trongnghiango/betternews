import { getCommentComments } from "@/lib/api";
import { useUpvoteCommentMutation, useUser } from "@/lib/api-hooks";
import { cx, relativeTime } from "@/lib/utils";
import type { Comment } from "@/shared/types";
import {
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import {
  ChevronUpIcon,
  MessageSquareIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { CommentForm } from "./comment-form";
import { MoreRepliesButton } from "./more-creplies-button";
import { Separator } from "./ui/separator";
import { Toggle } from "./ui/toggle";

export function CommentCard({
  comment,
  depth,
  activeReplyId,
  onActiveReplyIdChange,
  isLast,
}: {
  comment: Comment;
  depth: number;
  activeReplyId: number | null;
  onActiveReplyIdChange: Dispatch<SetStateAction<number | null>>;
  isLast: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isNested = depth > 0;
  const isReplying = activeReplyId === comment.id;
  const isDraft = comment.id === -1;

  const queryClient = useQueryClient();

  const user = useUser();

  const commentCommentsQuery = useSuspenseInfiniteQuery({
    queryKey: ["comments", "comment", comment.id],
    queryFn: ({ pageParam }) =>
      getCommentComments(String(comment.id), pageParam),
    initialPageParam: 1,
    staleTime: Infinity,
    initialData: {
      pageParams: [1],
      pages: [
        {
          success: true,
          message: "Comments fetched",
          data: comment.childComments ?? [],
          pagination: {
            page: 1,
            totalPages: Math.ceil(comment.commentCount / 2),
          },
        },
      ],
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.pagination.totalPages <= lastPageParam) {
        return undefined;
      }

      return lastPageParam + 1;
    },
  });
  const comments = commentCommentsQuery.data;
  const shouldRefetchFirstPage =
    comments.pages[0].data.length === 0 && comment.commentCount > 0;

  return (
    <div
      className={cx(
        isNested ? "ml-4 border-l border-border pl-4" : "",
        isDraft ? "pointer-events-none opacity-50" : "",
      )}
    >
      <div className="py-2">
        <div className="flex items-center gap-2 text-xs/5 text-muted-foreground">
          <CommentUpvoteToggle comment={comment} />
          <svg viewBox="0 0 2 2" className="size-0.5 fill-current" aria-hidden>
            <circle r={1} cx={1} cy={1} />
          </svg>
          <p className="whitespace-nowrap font-medium text-foreground">
            {comment.author.username}
          </p>
          <svg viewBox="0 0 2 2" className="size-0.5 fill-current" aria-hidden>
            <circle r={1} cx={1} cy={1} />
          </svg>
          <p className="whitespace-nowrap">{relativeTime(comment.createdAt)}</p>
          <svg viewBox="0 0 2 2" className="size-0.5 fill-current" aria-hidden>
            <circle r={1} cx={1} cy={1} />
          </svg>
          <Toggle
            pressed={isCollapsed}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-auto min-w-0 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-transparent"
            aria-label={isCollapsed ? "Expand comment" : "Collapse comment"}
          >
            {isCollapsed ? <PlusIcon /> : <MinusIcon />}
          </Toggle>
        </div>
        {!isCollapsed ? (
          <div className="mt-2 space-y-2">
            <div className="text-sm">{comment.content}</div>
            {user ? (
              <>
                <Toggle
                  pressed={isReplying}
                  onClick={() =>
                    onActiveReplyIdChange(isReplying ? null : comment.id)
                  }
                  className="h-auto min-w-0 gap-1 px-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-transparent [&_svg]:size-3"
                >
                  <MessageSquareIcon />
                  Reply
                </Toggle>
                {isReplying ? (
                  <CommentForm
                    id={comment.id}
                    isParent
                    onSuccess={() => onActiveReplyIdChange(null)}
                  />
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      {!isCollapsed ? (
        <>
          {comments.pages.map((page, index) => {
            const isLastPage = index === comments.pages.length - 1;

            return page.data.map((comment, index) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                depth={depth + 1}
                activeReplyId={activeReplyId}
                onActiveReplyIdChange={onActiveReplyIdChange}
                isLast={isLastPage && index === page.data.length - 1}
              />
            ));
          })}
          {commentCommentsQuery.hasNextPage || shouldRefetchFirstPage ? (
            <MoreRepliesButton
              disabled={commentCommentsQuery.isFetchingNextPage}
              onClick={async () => {
                if (shouldRefetchFirstPage) {
                  await queryClient.invalidateQueries({
                    queryKey: ["comments", "comment", comment.id],
                  });
                } else {
                  await commentCommentsQuery.fetchNextPage();
                }
              }}
            />
          ) : null}
        </>
      ) : null}
      {!isLast ? <Separator /> : null}
    </div>
  );
}

function CommentUpvoteToggle({
  comment,
}: {
  comment: Pick<
    Comment,
    "id" | "points" | "postId" | "parentCommentId" | "commentUpvotes"
  >;
}) {
  const isUpvoted = comment.commentUpvotes.length > 0;

  const user = useUser();

  const upvoteCommentMutation = useUpvoteCommentMutation();

  return (
    <Toggle
      pressed={isUpvoted}
      disabled={!user}
      onClick={() =>
        upvoteCommentMutation.mutate({
          id: comment.id,
          postId: comment.postId,
          parentCommentId: comment.parentCommentId,
        })
      }
      className="h-auto min-w-0 gap-1 px-0 hover:bg-transparent hover:text-primary data-[state=on]:bg-transparent data-[state=on]:text-primary"
      aria-label="Toggle comment upvote"
    >
      <ChevronUpIcon />
      <span className="text-xs">{comment.points}</span>
    </Toggle>
  );
}
