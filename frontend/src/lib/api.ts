import { hc, type InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";

import type { ApiRoutes, ErrorResponse, OrderBy, SortBy } from "@/shared/types";

const client = hc<ApiRoutes>("/", {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
}).api;

export async function signup(username: string, password: string) {
  try {
    const res = await client.auth.signup.$post({
      form: {
        username,
        password,
      },
    });
    if (!res.ok) {
      const data = (await res.json()) as unknown as ErrorResponse;
      return data;
    }

    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: String(error),
      isFormError: false,
    } satisfies ErrorResponse;
  }
}

export async function login(username: string, password: string) {
  try {
    const res = await client.auth.login.$post({
      form: {
        username,
        password,
      },
    });
    if (!res.ok) {
      const data = (await res.json()) as unknown as ErrorResponse;
      return data;
    }

    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: String(error),
      isFormError: false,
    } satisfies ErrorResponse;
  }
}

export async function getUser() {
  const res = await client.auth.user.$get();
  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.data.username;
}

export function userQueryOptions() {
  return queryOptions({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: Infinity,
  });
}

export type GetPostsSuccessResponse = InferResponseType<
  typeof client.posts.$get
>;
export async function getPosts({
  pageParam = 1,
  pagination,
}: {
  pageParam: number;
  pagination: {
    sortBy?: SortBy;
    orderBy?: OrderBy;
    author?: string;
    site?: string;
  };
}) {
  const res = await client.posts.$get({
    query: {
      page: String(pageParam),
      sortBy: pagination.sortBy,
      orderBy: pagination.orderBy,
      author: pagination.author,
      site: pagination.site,
    },
  });
  if (!res.ok) {
    const data = (await res.json()) as unknown as ErrorResponse;
    throw new Error(data.error);
  }

  return await res.json();
}

export async function upvotePost(id: string) {
  const res = await client.posts[":postId"].upvote.$patch({
    param: { postId: id },
  });
  if (!res.ok) {
    const data = (await res.json()) as unknown as ErrorResponse;
    throw new Error(data.error);
  }

  return await res.json();
}

export async function createPost(title: string, url: string, content: string) {
  try {
    const res = await client.posts.$post({
      form: {
        title,
        url,
        content,
      },
    });
    if (!res.ok) {
      const data = (await res.json()) as unknown as ErrorResponse;
      return data;
    }

    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: String(error),
      isFormError: false,
    } satisfies ErrorResponse;
  }
}
