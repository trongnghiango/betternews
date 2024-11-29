import { Loader2Icon } from "lucide-react";

export function DefaultPending() {
  return (
    <div className="mx-auto mt-8 flex flex-col items-center justify-center">
      <Loader2Icon className="animate-spin" />
      <p className="text-muted-foreground mt-2 text-sm">Loading…</p>
    </div>
  );
}
