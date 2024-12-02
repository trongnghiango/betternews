import { Loader2Icon } from "lucide-react";

export function DefaultPending() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
      <Loader2Icon className="animate-spin" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
