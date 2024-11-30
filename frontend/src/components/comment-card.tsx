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
import { MoreReplies } from "./more-creplies";
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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CommentUpvoteToggle comment={comment} />
          <span aria-hidden>&middot;</span>
          <span className="font-medium text-foreground">
            {comment.author.username}
          </span>
          <span aria-hidden>&middot;</span>
          <span>{relativeTime(comment.createdAt)}</span>
          <span aria-hidden>&middot;</span>
          <CommentViewToggle
            state={isCollapsed}
            onToggle={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
        {!isCollapsed ? (
          <div className="mt-2">
            <div>{comment.content}</div>
            {user ? (
              <div className="mt-2 grid gap-2">
                <button
                  onClick={() =>
                    onActiveReplyIdChange(isReplying ? null : comment.id)
                  }
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <MessageSquareIcon size={12} />
                  Reply
                </button>
                {isReplying ? (
                  <div className="mt-2">
                    <CommentForm
                      id={comment.id}
                      isParent
                      onSuccess={() => onActiveReplyIdChange(null)}
                    />
                  </div>
                ) : null}
              </div>
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
            <div className="mt-2">
              <MoreReplies
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
            </div>
          ) : null}
        </>
      ) : null}
      {!isLast ? <Separator className="my-2" /> : null}
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
      className="h-auto min-w-0 gap-1 p-0 hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-primary"
      aria-label="Toggle comment upvote"
    >
      <ChevronUpIcon />
      <span className="text-xs">{comment.points}</span>
    </Toggle>
  );
}

function CommentViewToggle({
  state,
  onToggle,
}: {
  state: boolean;
  onToggle: () => void;
}) {
  return (
    <Toggle
      pressed={state}
      onClick={onToggle}
      className="h-auto min-w-0 p-0 hover:bg-transparent data-[state=on]:bg-transparent"
      aria-label={state ? "Expand comment" : "Collapse comment"}
    >
      {state ? <PlusIcon /> : <MinusIcon />}
    </Toggle>
  );
}
