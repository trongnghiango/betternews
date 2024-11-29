import { AccordionContent } from "@radix-ui/react-accordion";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { AlertTriangleIcon } from "lucide-react";
import { useEffect } from "react";
import { Accordion, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";

export function DefaultErrorBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();

  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <div className="mt-8 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Oops! Something went wrong!</AlertTitle>
          <AlertDescription>
            We&apos;re sorry, but we encountered an unexpected error.
          </AlertDescription>
        </Alert>
        <div className="mt-4 space-y-4">
          <Button onClick={() => router.invalidate()} className="w-full">
            Try again
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Return to Homepage</Link>
          </Button>
          <ErrorDetails error={error} />
        </div>
      </div>
    </div>
  );
}

function ErrorDetails({ error }: Pick<ErrorComponentProps, "error">) {
  const isDev = process.env.NODE_ENV !== "production";

  return !isDev ? null : (
    <Accordion type="single" collapsible>
      <AccordionItem value="error-details">
        <AccordionTrigger>View error details</AccordionTrigger>
        <AccordionContent>
          <dl className="bg-muted rounded-md p-4">
            <dt className="mb-2 font-semibold">Error Message:</dt>
            <dd className="mb-4 text-sm">{error.message}</dd>
            <dt className="mb-2 font-semibold">Stack Trace:</dt>
            <dd className="text-xs">
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {error.stack}
              </pre>
            </dd>
          </dl>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
