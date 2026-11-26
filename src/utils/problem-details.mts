import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

type ValidationError = {
  issues: {
    path: PropertyKey[];
    message: string;
  }[];
};

export function problemDetails(
  c: Context,
  status: ContentfulStatusCode,
  title: string,
  detail: string,
) {
  return c.json(
    {
      type: "about:blank",
      title,
      status,
      detail,
      instance: c.req.path,
    },
    status,
    {
      "Content-Type": "application/problem+json",
    },
  );
}

export function validationProblem(c: Context, error: ValidationError) {
  return c.json(
    {
      type: "about:blank",
      title: "Validation Error",
      status: 400,
      detail: "Die übermittelten Daten sind ungültig.",
      instance: c.req.path,
      errors: error.issues.map((issue) => ({
        field: issue.path.map(String).join("."),
        message: issue.message,
      })),
    },
    400,
    {
      "Content-Type": "application/problem+json",
    },
  );
}
