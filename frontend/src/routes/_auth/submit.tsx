import { FieldErrorList } from "@/components/field-error-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/lib/api";
import { CreatePostSchema } from "@/shared/types";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useBlocker, useRouter } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/submit")({
  component: Submit,
});

function Submit() {
  const queryClient = useQueryClient();

  const router = useRouter();

  const navigate = Route.useNavigate();

  const form = useForm({
    defaultValues: {
      title: "",
      url: "",
      content: "",
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: CreatePostSchema,
    },
    onSubmit: async ({ value }) => {
      const { title, url, content } = value;

      const res = await createPost(title, url, content);
      if (res.success) {
        await queryClient.invalidateQueries({ queryKey: ["posts"] });
        await router.invalidate();

        await navigate({ to: "/post", search: { id: res.data.postId } });
      } else {
        if (!res.isFormError) {
          toast.error("Failed to create post", {
            description: res.error,
          });
        }

        form.setErrorMap({
          onServer: res.isFormError ? res.error : "Unexpected error",
        });
      }
    },
  });

  const shouldBlock = form.useStore(
    (state) => state.isDirty && !state.isSubmitting,
  );
  useBlocker({
    condition: shouldBlock,
    blockerFn: () => window.confirm("Are you sure you want to leave?"),
  });

  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();

            void form.handleSubmit();
          }}
        >
          <CardHeader>
            <CardTitle asChild>
              <h1>Create New Post</h1>
            </CardTitle>
            <CardDescription>
              Leave url blank to submit a question for discussion. If there is
              no url, text will appear at the top of the thread. If there is a
              url, text is optional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <form.Field name="title">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Title</Label>
                    <Input
                      type="text"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    <FieldErrorList field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="url">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>URL</Label>
                    <Input
                      type="url"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    <FieldErrorList field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="content">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Content</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
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
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    disabled={!canSubmit || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "Submitting…" : "Submit"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
