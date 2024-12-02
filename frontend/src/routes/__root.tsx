import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { useUser } from "@/lib/api-hooks";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  type LinkComponentProps,
} from "@tanstack/react-router";
import { CircleUserIcon, MenuIcon } from "lucide-react";
import { lazy, useState } from "react";

const navigation: {
  name: string;
  to: LinkComponentProps["to"];
  search?: LinkComponentProps["search"];
}[] = [
  { name: "Top", to: "/", search: { sortBy: "points", orderBy: "desc" } },
  { name: "Newest", to: "/", search: { sortBy: "recent", orderBy: "desc" } },
  { name: "Submit", to: "/submit" },
];

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <div className="isolate flex min-h-screen flex-col bg-[#f5f5ed]">
        <Header />
        <main className="grow">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
        <footer className="py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-muted-foreground">
              BetterNews &copy;
            </p>
          </div>
        </footer>
      </div>
      <Toaster />
      <ReactQueryDevtools />
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

function Header() {
  const user = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between py-4">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold tracking-tight">
              BetterNews
            </Link>
          </div>
          <div className="flex items-center max-md:hidden">
            {user ? (
              <UserDropdown />
            ) : (
              <Button asChild size="sm" variant="secondary">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </div>
          <MobileNav />
        </div>
        <nav className="-mb-px flex gap-6 border-t border-border max-md:hidden">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.to}
              search={item.search}
              className="inline-flex items-center whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium"
              activeProps={{ className: "border-primary text-primary" }}
              inactiveProps={{
                className:
                  "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function UserDropdown() {
  const user = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full [&_svg]:size-5 [&_svg]:shrink-0"
        >
          <CircleUserIcon />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">{user}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="api/auth/logout">Log out</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav() {
  const user = useUser();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="secondary" className="md:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="px-0">
        <SheetHeader className="px-6 text-left">
          <SheetTitle className="text-2xl font-bold tracking-tight">
            BetterNews
          </SheetTitle>
          <SheetDescription className="sr-only">Navigation</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 pb-3 pt-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.to}
              search={item.search}
              onClick={() => setIsOpen(false)}
              className="block whitespace-nowrap border-l-4 py-2 pl-5 pr-6 font-medium"
              activeProps={{
                className: "border-primary text-primary bg-primary/20",
              }}
              inactiveProps={{
                className:
                  "text-muted-foreground hover:bg-muted/20 hover:border-muted-foreground/30 hover:text-foreground border-transparent",
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border pb-3 pt-4">
          {user ? (
            <>
              <div className="px-6">
                <p className="font-medium text-muted-foreground">
                  Signed in as <span className="text-foreground">{user}</span>.
                </p>
              </div>
              <div className="mt-3 px-6">
                <Button asChild variant="secondary" className="w-full">
                  <a href="api/auth/logout">Sign out</a>
                </Button>
              </div>
            </>
          ) : (
            <div className="px-6">
              <p className="font-medium text-muted-foreground">
                You aren&apos;t signed in.
              </p>
              <div className="mt-3">
                <Button asChild className="w-full">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
