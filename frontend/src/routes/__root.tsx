import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { SiteHeader } from "@/components/site-header";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <div className="flex min-h-screen flex-col bg-[#f5f5ed]">
        <SiteHeader />
        <main className="container mx-auto grow p-4">
          <Outlet />
        </main>
        <footer className="p-4 text-center">
          <p className="text-sm text-muted-foreground">BetterNews &copy;</p>
        </footer>
      </div>
      <ReactQueryDevtools />
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
