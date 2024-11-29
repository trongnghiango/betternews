import type { ApiRoutes, ErrorResponse, OrderBy, SortBy } from "@/shared/types";
import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { hc, type InferResponseType } from "hono/client";

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

export type GetPostsSuccessResponse = InferResponseType<
  typeof client.posts.$get
>;
export async function getPosts({
  page = 1,
  pagination,
}: {
  page: number;
  pagination: {
    sortBy?: SortBy;
    orderBy?: OrderBy;
    author?: string;
    site?: string;
  };
}) {
  const res = await client.posts.$get({
    query: {
      page: String(page),
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

export async function getPost(id: string) {
  const res = await client.posts[":id"].$get({
    param: {
      id,
    },
  });

  if (res.status === 404) {
    throw notFound();
  }

  if (!res.ok) {
    const data = (await res.json()) as unknown as ErrorResponse;
    throw new Error(data.error);
  }

  return await res.json();
}

export async function getPostComments(
  id: string,
  {
    page = 1,
    pagination,
  }: {
    page: number;
    pagination: {
      sortBy?: SortBy;
      orderBy?: OrderBy;
    };
  },
) {
  const res = await client.posts[":id"].comments.$get({
    param: { id },
    query: {
      page: String(page),
      sortBy: pagination.sortBy,
      orderBy: pagination.orderBy,
      includeChildren: "true",
    },
  });
  if (!res.ok) {
    const data = (await res.json()) as unknown as ErrorResponse;
    throw new Error(data.error);
  }

  return await res.json();
}

export async function upvotePost(id: string) {
  const res = await client.posts[":id"].upvote.$patch({
    param: { id },
  });
  if (!res.ok) {
    const data = (await res.json()) as unknown as ErrorResponse;
    throw new Error(data.error);
  }

  return await res.json();
}

export async function createComment(
  id: string,
  content: string,
  isNested?: boolean,
) {
  try {
    const res = isNested
      ? await client.comments[":id"].$post({
          param: {
            id,
          },
          form: {
            content,
          },
        })
      : await client.posts[":id"].comment.$post({
          param: {
            id,
          },
          form: {
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

export async function getCommentComments(id: string, page = 1, limit = 2) {
  const res = await client.comments[":id"].comments.$get({
    param: { id },
    query: {
      page: String(page),
      limit: String(limit),
    },
  });
  if (!res.ok) {
    const data = (await res.json()) as unknown as ErrorResponse;
    throw new Error(data.error);
  }

  return await res.json();
}

export async function upvoteComment(id: string) {
  const res = await client.comments[":id"].upvote.$patch({
    param: { id },
  });
  if (!res.ok) {
    const data = (await res.json()) as unknown as ErrorResponse;
    throw new Error(data.error);
  }

  return await res.json();
}
