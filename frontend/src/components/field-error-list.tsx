import { cx } from "@/lib/utils";
import type { FieldApi } from "@tanstack/react-form";

export function FieldErrorList({
  field,
  className,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: FieldApi<any, any, any, any, any>;
  className?: string;
}) {
  return field.state.meta.isTouched && field.state.meta.errors.length ? (
    <ul id={`${field.name}-errors`} className={cx("space-y-1", className)}>
      {field.state.meta.errors
        .map((error) => error?.toString().split(", "))
        .map((error) =>
          error?.map((error, i) => (
            <li key={i} className="text-[0.8rem] font-medium text-destructive">
              {error}
            </li>
          )),
        )}
    </ul>
  ) : null;
}
