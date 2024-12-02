import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { AlertTriangleIcon } from "lucide-react";
import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export function DefaultErrorBoundary({ error }: ErrorComponentProps) {
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <div className="py-10">
      <div className="mx-auto max-w-md">
        <div className="space-y-6">
          <Alert variant="destructive" className="bg-background [&_svg]:size-4">
            <AlertTriangleIcon />
            <AlertTitle>Oops! Something went wrong!</AlertTitle>
            <AlertDescription>
              We&apos;re sorry, but we encountered an unexpected error.
            </AlertDescription>
          </Alert>
          <div className="space-y-4">
            <ReloadButton />
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Return to Homepage</Link>
            </Button>
            <ErrorDetails error={error} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReloadButton() {
  const router = useRouter();

  return (
    <Button onClick={() => router.invalidate()} className="w-full">
      Try again
    </Button>
  );
}

function ErrorDetails({ error }: Pick<ErrorComponentProps, "error">) {
  const isDev = process.env.NODE_ENV !== "production";

  return !isDev ? null : (
    <Accordion type="single" collapsible>
      <AccordionItem value="error-details" className="border-none">
        <AccordionTrigger>View error details</AccordionTrigger>
        <AccordionContent>
          <Card>
            <CardContent className="p-4">
              <dl>
                <dt className="font-semibold">Error Message:</dt>
                <dd className="mt-2 text-sm">{error.message}</dd>
                <dt className="mt-4 font-semibold">Stack Trace:</dt>
                <dd className="mt-2 text-xs">
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </dd>
              </dl>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
