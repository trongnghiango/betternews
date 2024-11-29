import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { DefaultError } from "./components/default-error";
import { DefaultNotFound } from "./components/default-not-found";
import { DefaultPending } from "./components/default-pending";
import "./globals.css";
import { routeTree } from "./routeTree.gen";

// Set up a Query client instance
const queryClient = new QueryClient();

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
  },
  defaultPendingComponent: DefaultPending,
  defaultNotFoundComponent: DefaultNotFound,
  defaultErrorComponent: DefaultError,
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
