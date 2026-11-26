// Fehlermeldungen als "Problem Details for HTTP APIs" (RFC 9457):
// einheitliches JSON-Format mit type, title, status, detail und instance

import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

// Ausschnitt aus dem Fehlerobjekt von Zod, der hier benötigt wird:
// pro Fehler der Pfad zum Feld und die Fehlermeldung
type ValidationError = {
  issues: {
    path: PropertyKey[];
    message: string;
  }[];
};

/**
 * Fehler-Response im Format Problem Details erzeugen.
 * @param c Context von Hono für den aktuellen Request
 * @param status HTTP-Statuscode, z.B. 404
 * @param title Kurzbezeichnung des Fehlers, z.B. "Not Found"
 * @param detail Erklärung für genau diesen Fehlerfall
 */
export function problemDetails(
  c: Context,
  status: ContentfulStatusCode,
  title: string,
  detail: string,
) {
  return c.json(
    {
      // about:blank: es gibt keine eigene URI für die Fehlerart, der Statuscode genügt
      type: "about:blank",
      title,
      status,
      detail,
      // Pfad des Requests, bei dem der Fehler aufgetreten ist
      instance: c.req.path,
    },
    status,
    {
      // Media Type laut RFC 9457 statt application/json
      "Content-Type": "application/problem+json",
    },
  );
}

/**
 * Fehler-Response 400 für einen ungültigen Request-Body erzeugen.
 * Zusätzlich zu den Standard-Properties enthält "errors" pro Fehler das Feld und die Meldung.
 * @param c Context von Hono für den aktuellen Request
 * @param error Fehlerobjekt von Zod
 */
export function validationProblem(c: Context, error: ValidationError) {
  return c.json(
    {
      type: "about:blank",
      title: "Validation Error",
      status: 400,
      detail: "Die übermittelten Daten sind ungültig.",
      instance: c.req.path,
      // path ist ein Array, z.B. ["title"] oder bei verschachtelten Objekten ["a", "b"] -> "a.b"
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
