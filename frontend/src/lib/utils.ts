import { defineConfig } from "cva";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";

export type { VariantProps } from "cva";

export const { cva, cx, compose } = defineConfig({
  hooks: {
    onComplete: (className) => twMerge(className),
  },
});

export function relativeTime(date: string) {
  const dateTime = DateTime.fromISO(date);

  return dateTime.toRelative();
}
