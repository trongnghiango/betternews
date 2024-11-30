import { cx } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { Button } from "./ui/button";

export function MoreReplies({
  className,
  disabled,
  loadingText,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loadingText?: string }) {
  return (
    <Button
      size="sm"
      variant="secondary"
      className={cx("[&_svg]:size-4 [&_svg]:shrink-0", className)}
      {...props}
    >
      <ChevronDownIcon />
      {disabled ? (loadingText ?? "Loading…") : "More replies"}
    </Button>
  );
}
