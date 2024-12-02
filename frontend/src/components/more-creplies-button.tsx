import { ChevronDownIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

export function MoreRepliesButton({
  disabled,
  loadingText,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loadingText?: string }) {
  return (
    <button
      disabled={disabled}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
      {...props}
    >
      <ChevronDownIcon />
      {disabled ? (loadingText ?? "Loading…") : "More replies"}
    </button>
  );
}
