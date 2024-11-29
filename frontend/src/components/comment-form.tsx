import { useCreateCommentMutation } from "@/lib/api-hooks";
import { CreateCommentSchema } from "@/shared/types";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useRef } from "react";
import { toast } from "sonner";
import { FieldInfo } from "./field-info";
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
      onChange: CreateCommentSchema,
    },
    onSubmit: async ({ value }) => {
      const { content } = value;

      await createCommentMutation.mutateAsync(
        { id: String(id), content, isParent },
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
                onSubmit: data.isFormError ? data.error : "Unexpected error",
              });
            }
          },
        },
      );
    },
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();

        await form.handleSubmit();
      }}
    >
      <div className="grid gap-2">
        <form.Field name="content">
          {(field) => (
            <div className="grid gap-2">
              <Textarea
                ref={contentRef}
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                rows={4}
                onChange={(event) => field.handleChange(event.target.value)}
                className="resize-none"
                placeholder="What are you thoughts?"
                aria-label="Content"
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => [state.errorMap]}>
          {([errorMap]) =>
            errorMap.onSubmit ? (
              <p className="text-[0.8rem] font-medium text-destructive">
                {errorMap.onSubmit.toString()}
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
