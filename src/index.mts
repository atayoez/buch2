import { Hono } from "hono";
import booksRouter from "./routes/books.mts";

const app = new Hono();

// Books-Routen registrieren
app.route("/books", booksRouter);

export default app;

export const port = 3000;

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`Server läuft auf http://localhost:${port}`);
