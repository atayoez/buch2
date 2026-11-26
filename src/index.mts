import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import booksRouter from "./routes/books.mts";
import { problemDetails } from "./utils/problem-details.mts";

export const app = new Hono();

// Books-Routen registrieren
app.route("/books", booksRouter);

// Unbekannte Pfade: Problem Details (RFC 9457) statt Text "404 Not Found"
app.notFound((c) => problemDetails(c, 404, "Not Found", `Der Pfad ${c.req.path} existiert nicht`));

// Alle nicht behandelten Fehler: Problem Details statt Text "Internal Server Error"
app.onError((err, c) => {
  // z.B. fehlerhaftes JSON im Request-Body
  if (err instanceof HTTPException) {
    return problemDetails(c, err.status, "Request Error", err.message);
  }

  console.error(err);
  return problemDetails(c, 500, "Internal Server Error", "Ein unerwarteter Fehler ist aufgetreten");
});

// Kein "export default app": Bun würde dafür automatisch einen zweiten Server
// auf demselben Port starten (EADDRINUSE). Der Server wird nur durch Bun.serve gestartet.
export const port = 3000;

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`Server läuft auf http://localhost:${port}`);
