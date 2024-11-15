import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  throw new Error("Testing error component");
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
    </div>
  );
}
