import { Hono } from "hono";
import booksRouter from "./routes/books.mts";

export const app = new Hono();

// Books-Routen registrieren
app.route("/books", booksRouter);

// Kein "export default app": Bun würde dafür automatisch einen zweiten Server
// auf demselben Port starten (EADDRINUSE). Der Server wird nur durch Bun.serve gestartet.
export const port = 3000;

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`Server läuft auf http://localhost:${port}`);
