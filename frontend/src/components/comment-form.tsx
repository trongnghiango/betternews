import { useCreateCommentMutation } from "@/lib/api-hooks";
import { CreateCommentSchema } from "@/shared/types";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useRef } from "react";
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
      <div className="grid gap-4">
        <form.Field name="content">
          {(field) => (
            <div className="grid gap-2">
              <Textarea
                ref={contentRef}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                rows={4}
                className="resize-none"
                placeholder="What are you thoughts?"
                aria-label="Content"
              />
              <FieldErrorList field={field} />
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => [state.errorMap]}>
          {([errorMap]) =>
            errorMap.onServer ? (
              <p className="text-[0.8rem] font-medium text-destructive">
                {errorMap.onServer.toString()}
              </p>
            ) : null
          }
        </form.Subscribe>
        <div className="flex justify-end">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Saving…" : "Save"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>
    </form>
  );
}
