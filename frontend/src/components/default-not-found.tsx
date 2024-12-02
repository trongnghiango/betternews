import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export function DefaultNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-lg">Page not found</p>
      <div className="mt-6">
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
