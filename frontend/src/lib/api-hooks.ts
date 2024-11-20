import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { current, produce } from "immer";
import { toast } from "sonner";

import { type Post, type SuccessResponse } from "@/shared/types";

import { upvotePost, type GetPostsSuccessResponse } from "./api";

export function updatePostUpvote(draft: Post) {
  draft.points += draft.isUpvoted ? -1 : 1;
  draft.isUpvoted = !draft.isUpvoted;
}

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

          updatePostUpvote(draft.data);
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
                updatePostUpvote(post);
              }
            }
          }
        }),
      );

      return { prevData };
    },
    onSuccess: (upvoteData, variables) => {
      const postId = Number(variables);

      queryClient.setQueryData<SuccessResponse<Post>>(
        ["post", postId],
        produce((draft) => {
          if (!draft) {
            return undefined;
          }

          draft.data.points = upvoteData.data.count;
          draft.data.isUpvoted = upvoteData.data.isUpvoted;
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
                post.points = upvoteData.data.count;
                post.isUpvoted = upvoteData.data.isUpvoted;
              }
            }
          }
        }),
      );

      queryClient.invalidateQueries({
        queryKey: ["posts"],
        type: "inactive",
        refetchType: "none",
      });
    },
    onError: (_error, variables, context) => {
      const postId = Number(variables);

      queryClient.invalidateQueries({ queryKey: ["post", postId] });

      toast.error("Failed to upvote post");

      if (context?.prevData) {
        queryClient.setQueriesData<InfiniteData<GetPostsSuccessResponse>>(
          { queryKey: ["posts"], type: "active" },
          context.prevData,
        );
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    },
  });
}
