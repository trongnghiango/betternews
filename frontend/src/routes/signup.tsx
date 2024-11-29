import { FieldInfo } from "@/components/field-info";
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
import { signup, userQueryOptions } from "@/lib/api";
import { LoginSchema } from "@/shared/types";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { fallback, zodSearchValidator } from "@tanstack/router-zod-adapter";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { toast } from "sonner";
import { z } from "zod";

const SignupSearchSchema = z.object({
  redirect: fallback(z.string(), "/").default("/"),
});

export const Route = createFileRoute("/signup")({
  component: Signup,
  validateSearch: zodSearchValidator(SignupSearchSchema),
  beforeLoad: async ({ context, search }) => {
    const user = await context.queryClient.ensureQueryData(userQueryOptions());
    if (user) {
      throw redirect({ to: search.redirect });
    }
  },
});

function Signup() {
  const queryClient = useQueryClient();

  const router = useRouter();

  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: LoginSchema,
    },
    onSubmit: async ({ value }) => {
      const { username, password } = value;

      const res = await signup(username, password);
      if (res.success) {
        await queryClient.invalidateQueries({ queryKey: ["user"] });
        await router.invalidate();

        await navigate({ to: search.redirect });
      } else {
        if (!res.isFormError) {
          toast.error("Failed to create an account", {
            description: res.error,
          });
        }

        form.setErrorMap({
          onSubmit: res.isFormError ? res.error : "Unexpected error",
        });
      }
    },
  });

  return (
    <Card className="border-border/25 mx-auto mt-12 max-w-sm">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
      >
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <form.Field name="username">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Username</Label>
                  <Input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    type="password"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => [state.errorMap]}>
              {([errorMap]) =>
                errorMap.onSubmit ? (
                  <p className="text-destructive text-[0.8rem] font-medium">
                    {errorMap.onSubmit.toString()}
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
                  {isSubmitting ? "Creating an account…" : "Create an account"}
                </Button>
              )}
            </form.Subscribe>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" search={search} className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
