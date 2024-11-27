import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { current, produce } from "immer";
import { toast } from "sonner";

import {
  type Comment,
  type Post,
  type SuccessResponse,
  type SuccessResponseWithPagination,
} from "@/shared/types";

import {
  createComment,
  upvoteComment,
  upvotePost,
  type GetPostsSuccessResponse,
} from "./api";

export function useUpvotePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upvotePost,
    onMutate: async (variables) => {
      const postId = Number(variables);

      let prevData: InfiniteData<GetPostsSuccessResponse> | undefined;

      await queryClient.cancelQueries({ queryKey: ["post", Number(postId)] });

      queryClient.setQueryData<SuccessResponse<Post>>(
        ["post", postId],
        produce((draft) => {
          if (!draft) {
            return undefined;
          }

          draft.data.points += draft.data.isUpvoted ? -1 : 1;
          draft.data.isUpvoted = !draft.data.isUpvoted;
        }),
      );

      queryClient.setQueriesData<InfiniteData<GetPostsSuccessResponse>>(
        { queryKey: ["posts"], type: "active" },
        produce((oldData) => {
          prevData = current(oldData);
          if (!oldData) {
            return undefined;
          }

          for (const page of oldData.pages) {
            for (const post of page.data) {
              if (post.id === postId) {
                post.points += post.isUpvoted ? -1 : 1;
                post.isUpvoted = !post.isUpvoted;
              }
            }
          }
        }),
      );

      return { prevData };
    },
    onSuccess: async (data, variables) => {
      const postId = Number(variables);

      queryClient.setQueryData<SuccessResponse<Post>>(
        ["post", postId],
        produce((draft) => {
          if (!draft) {
            return undefined;
          }

          draft.data.points = data.data.count;
          draft.data.isUpvoted = data.data.isUpvoted;
        }),
      );

      queryClient.setQueriesData<InfiniteData<GetPostsSuccessResponse>>(
        { queryKey: ["posts"] },
        produce((oldData) => {
          if (!oldData) {
            return undefined;
          }

          for (const page of oldData.pages) {
            for (const post of page.data) {
              if (post.id === postId) {
                post.points = data.data.count;
                post.isUpvoted = data.data.isUpvoted;
              }
            }
          }
        }),
      );

      await queryClient.invalidateQueries({
        queryKey: ["posts"],
        type: "inactive",
        refetchType: "none",
      });
    },
    onError: async (_error, variables, context) => {
      const postId = Number(variables);

      await queryClient.invalidateQueries({ queryKey: ["post", postId] });

      toast.error("Failed to upvote post");

      if (context?.prevData) {
        queryClient.setQueriesData<InfiniteData<GetPostsSuccessResponse>>(
          { queryKey: ["posts"], type: "active" },
          context.prevData,
        );
        await queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    },
  });
}

export function useUpvoteCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
    }: {
      id: string;
      parentCommentId: number | null;
      postId: number;
    }) => upvoteComment(id),
    onMutate: async ({ id, parentCommentId, postId }) => {
      let prevData:
        | InfiniteData<SuccessResponseWithPagination<Comment[]>>
        | undefined;

      const queryKey = parentCommentId
        ? ["comments", "comment", parentCommentId]
        : ["comments", "post", postId];

      await queryClient.cancelQueries({ queryKey });

      queryClient.setQueriesData<
        InfiniteData<SuccessResponseWithPagination<Comment[]>>
      >(
        { queryKey },
        produce((oldData) => {
          prevData = current(oldData);
          if (!oldData) {
            return undefined;
          }

          for (const page of oldData.pages) {
            for (const comment of page.data) {
              if (String(comment.id) === id) {
                const isUpvoted = comment.commentUpvotes.length > 0;
                comment.points += isUpvoted ? -1 : 1;
                comment.commentUpvotes = isUpvoted ? [] : [{ userId: "" }];
              }
            }
          }
        }),
      );

      return { prevData };
    },
    onSuccess: async (data, { id, parentCommentId, postId }) => {
      const queryKey = parentCommentId
        ? ["comments", "comment", parentCommentId]
        : ["comments", "post", postId];

      queryClient.setQueriesData<
        InfiniteData<SuccessResponseWithPagination<Comment[]>>
      >(
        { queryKey },
        produce((oldData) => {
          if (!oldData) {
            return undefined;
          }

          for (const page of oldData.pages) {
            for (const comment of page.data) {
              if (String(comment.id) === id) {
                comment.points = data.data.count;
                comment.commentUpvotes = data.data.commentUpvotes;
              }
            }
          }
        }),
      );

      await queryClient.invalidateQueries({
        queryKey: ["comments", "post"],
        refetchType: "none",
      });
    },
    onError: async (_error, { parentCommentId, postId }, context) => {
      const queryKey = parentCommentId
        ? ["comments", "comment", parentCommentId]
        : ["comments", "post", postId];

      toast.error("Failed to upvote comment");

      if (context?.prevData) {
        queryClient.setQueriesData({ queryKey }, context.prevData);
        await queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

export function useCreateCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      content,
      isParent,
    }: {
      id: string;
      content: string;
      isParent?: boolean;
    }) => createComment(id, content, isParent),
    onMutate: ({ id, content, isParent }) => {
      let prevData:
        | InfiniteData<SuccessResponseWithPagination<Comment[]>>
        | undefined;

      const queryKey = isParent
        ? ["comments", "comment", Number(id)]
        : ["comments", "post", Number(id)];
      console.log(queryKey);

      const user = queryClient.getQueryData<string>(["user"]);

      queryClient.setQueriesData<
        InfiniteData<SuccessResponseWithPagination<Comment[]>>
      >(
        { queryKey },
        produce((oldData) => {
          prevData = current(oldData);
          if (!oldData) {
            return undefined;
          }

          if (oldData.pages.length > 0) {
            const draftComment = {
              id: -1,
              userId: "",
              content,
              points: 0,
              commentCount: 0,
              createdAt: new Date().toISOString(),
              postId: Number(id),
              parentCommentId: null,
              depth: 0,
              commentUpvotes: [],
              author: {
                username: user ?? "",
                id: "",
              },
              childComments: [],
            };
            oldData.pages[0].data.unshift(draftComment);
          }
        }),
      );

      return { prevData };
    },
    onSuccess: async (data, { id, isParent }) => {
      const queryKey = isParent
        ? ["comments", "comment", Number(id)]
        : ["comments", "post", Number(id)];

      if (data.success) {
        await queryClient.invalidateQueries({
          queryKey: ["post", data.data.postId],
        });

        queryClient.setQueriesData<
          InfiniteData<SuccessResponseWithPagination<Comment[]>>
        >(
          { queryKey },
          produce((oldData) => {
            if (!oldData) {
              return undefined;
            }

            if (oldData.pages.length > 0) {
              oldData.pages[0].data = [
                data.data,
                ...oldData.pages[0].data.filter((comment) => comment.id !== -1),
              ];
            }
          }),
        );
      }
    },
    onError: async (_error, { id, isParent }) => {
      const queryKey = isParent
        ? ["comments", "comment", Number(id)]
        : ["comments", "post", Number(id)];

      toast.error("Failed to create comment");

      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
