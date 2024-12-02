import { useCreateCommentMutation } from "@/lib/api-hooks";
import { CreateCommentSchema } from "@/shared/types";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { FieldErrorList } from "./field-error-list";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export function CommentForm({
  id,
  isParent,
  onSuccess,
}: {
  id: number;
  isParent?: boolean;
  onSuccess?: () => void;
}) {
  const createCommentMutation = useCreateCommentMutation();

  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isParent) {
      contentRef.current?.focus();
    }
  }, [isParent]);

  const form = useForm({
    defaultValues: {
      content: "",
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: CreateCommentSchema,
    },
    onSubmit: async ({ value }) => {
      const { content } = value;

      await createCommentMutation.mutateAsync(
        { id, content, isParent },
        {
          onSuccess: (data) => {
            if (data.success) {
              if (!isParent) {
                form.reset();
                contentRef.current?.focus();
              }

              onSuccess?.();
            } else {
              if (!data.isFormError) {
                toast.error("Failed to create comment", {
                  description: data.error,
                });
              }

              form.setErrorMap({
                onServer: data.isFormError ? data.error : "Unexpected error",
              });
            }
          },
        },
      );
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();

        void form.handleSubmit();
      }}
    >
      <div className="relative">
        <div className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring">
          <form.Field name="content">
            {(field) => (
              <Textarea
                ref={contentRef}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                rows={3}
                className="resize-none scroll-py-3 border-0 p-3 shadow-none focus-visible:ring-0"
                placeholder="What are you thoughts?"
                aria-label="Content"
              />
            )}
          </form.Field>
          {/* Spacer element to match the height of the toolbar */}
          <div className="py-2" aria-hidden>
            <div className="h-9" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-end px-3 py-2">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Posting…" : "Post"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>
      <form.Field name="content">
        {(field) => <FieldErrorList field={field} className="mt-2" />}
      </form.Field>
      <form.Subscribe selector={(state) => [state.errorMap]}>
        {([errorMap]) =>
          errorMap.onServer ? (
            <p className="mt-2 text-[0.8rem] font-medium text-destructive">
              {errorMap.onServer.toString()}
            </p>
          ) : null
        }
      </form.Subscribe>
    </form>
  );
}
