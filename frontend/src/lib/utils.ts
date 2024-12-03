import { defineConfig } from "cva";
import { formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";

export type { VariantProps } from "cva";

export const { cva, cx, compose } = defineConfig({
  hooks: {
    onComplete: (className) => twMerge(className),
  },
});

export function relativeTime(date: string) {
  return formatDistanceToNowStrict(date, {
    addSuffix: true,
  });
}
