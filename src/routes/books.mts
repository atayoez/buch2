// REST-Schnittstelle für Bücher:
// - GET    /books               alle Bücher
// - GET    /books/:id           ein Buch mit Details und Kapiteln, bedingter GET mit If-None-Match
// - POST   /books               neues Buch (geschützt)
// - POST   /books/:id/chapters  neues Kapitel zu einem Buch (geschützt)
// - PUT    /books/:id           Buch ändern, If-Match gegen Lost Updates (geschützt)
// - PATCH  /books/:id           Buch teilweise ändern, If-Match gegen Lost Updates (geschützt)

// Hono, Drizzle-Operatoren für WHERE/ORDER BY und Middleware für die Validierung mit Zod
import { Hono } from "hono";
import type { Context } from "hono";
import { eq, asc, and, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";

// DB-Zugriff und Tabellen
import { db } from "../db/db.mts";
import { books } from "../db/schemas/books.mts";
import { chapters } from "../db/schemas/chapters.mts";

// Zod-Schemas für die Request-Bodies
import {
  createBookSchema,
  createChapterSchema,
  patchBookSchema,
  updateBookSchema,
} from "../schemas/book.schema.ts";

// Zugriffsschutz und Fehlermeldungen als Problem Details
import { rolesRequired } from "../security/roles-required.mts";
import { validationProblem, problemDetails } from "../utils/problem-details.mts";

// Router für alle Pfade unterhalb von /books, wird in index.mts registriert
export const booksRouter = new Hono();

// GET: Alle Bücher abrufen
booksRouter.get("/", async (c) => {
  // SELECT * FROM books (ohne Details und Kapitel)
  const result = await db.select().from(books);

  return c.json(result);
});

// GET: Einzelnes Buch inklusive Details und Kapiteln
// Bedingter GET-Request mit ETag und If-None-Match
booksRouter.get("/:id", async (c) => {
  // Pfadparameter :id ist ein String und muss eine positive ganze Zahl sein
  const id = Number(c.req.param("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return problemDetails(c, 400, "Bad Request", "Ungültige Buch-ID");
  }

  // Buch mit 1:1-Beziehung (details) und 1:N-Beziehung (chapters) in einer Abfrage laden
  const result = await db.query.books.findFirst({
    where: eq(books.id, id),
    with: {
      details: true,
      chapters: {
        orderBy: [asc(chapters.chapterNumber)],
      },
    },
  });

  // Kein Buch mit dieser ID vorhanden
  if (!result) {
    return problemDetails(c, 404, "Not Found", "Buch nicht gefunden");
  }

  // ETag ist die Versionsnummer: derselbe Wert wird bei PUT im Header If-Match erwartet
  const etag = `"${result.version}"`;

  c.header("ETag", etag);

  // If-None-Match überprüfen
  const ifNoneMatch = c.req.header("If-None-Match");

  // Der Header kann mehrere ETags mit Komma enthalten, evtl. mit Präfix W/ für "weak".
  // "*" passt auf jede Version.
  const matches =
    ifNoneMatch === "*" ||
    ifNoneMatch?.split(",").some((value) => value.trim().replace(/^W\//, "") === etag);

  // Der Client hat bereits die aktuelle Version: 304 Not Modified ohne Body
  if (matches) {
    return c.body(null, 304);
  }

  return c.json(result, 200);
});

// Alle schreibenden Requests (POST, PUT, PATCH) sind geschützt:
// Access Token von Keycloak mit der Rolle "admin" erforderlich

// POST: Neues Buch erstellen
booksRouter.post(
  "/",
  // 1. Zugriffsschutz: 401 ohne gültigen Token, 403 ohne die Rolle admin
  rolesRequired("admin"),
  // 2. Validierung des Request-Bodys: 400 mit den Fehlern von Zod
  zValidator("json", createBookSchema, (result, c) => {
    if (!result.success) {
      return validationProblem(c, result.error);
    }
  }),
  async (c) => {
    // Der Body ist an dieser Stelle bereits durch Zod validiert und typisiert
    const body = c.req.valid("json");

    // INSERT: id, version und Zeitstempel werden von der DB generiert.
    // returning() liefert den neuen Datensatz als Array mit einem Element
    const [newBook] = await db
      .insert(books)
      .values({
        title: body.title,
      })
      .returning();

    if (!newBook) {
      return problemDetails(c, 500, "Internal Server Error", "Buch konnte nicht erstellt werden");
    }

    // 201 Created mit dem Pfad des neuen Buchs im Header Location
    return c.json(newBook, 201, {
      Location: `/books/${newBook.id}`,
    });
  },
);

// POST: Kapitel zu einem Buch hinzufügen
booksRouter.post(
  "/:id/chapters",
  // 1. Zugriffsschutz: 401 ohne gültigen Token, 403 ohne die Rolle admin
  rolesRequired("admin"),
  // 2. Validierung des Request-Bodys: 400 mit den Fehlern von Zod
  zValidator("json", createChapterSchema, (result, c) => {
    if (!result.success) {
      return validationProblem(c, result.error);
    }
  }),
  async (c) => {
    // ID des Buchs, zu dem das Kapitel gehört
    const bookId = Number(c.req.param("id"));

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return problemDetails(c, 400, "Bad Request", "Ungültige Buch-ID");
    }

    const body = c.req.valid("json");

    // Das Buch muss existieren, sonst würde der Fremdschlüssel in der DB verletzt
    const [existingBook] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);

    if (!existingBook) {
      return problemDetails(c, 404, "Not Found", "Buch nicht gefunden");
    }

    // INSERT in die Tabelle der 1:N-Beziehung
    const [newChapter] = await db
      .insert(chapters)
      .values({
        bookId,
        chapterNumber: body.chapterNumber,
        title: body.title,
      })
      .returning();

    if (!newChapter) {
      return problemDetails(
        c,
        500,
        "Internal Server Error",
        "Kapitel konnte nicht erstellt werden",
      );
    }

    // 201 Created mit dem Pfad des neuen Kapitels im Header Location
    return c.json(newChapter, 201, {
      Location: `/books/${bookId}/chapters/${newChapter.id}`,
    });
  },
);

// Gemeinsame Logik für PUT und PATCH: Update nur mit passender Version im Header If-Match
const updateBook = async (c: Context, values: { title?: string | undefined }) => {
  // Pfadparameter :id muss eine positive ganze Zahl sein
  const id = Number(c.req.param("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return problemDetails(c, 400, "Bad Request", "Ungültige Buch-ID");
  }

  // If-Match auslesen
  const ifMatch = c.req.header("If-Match");

  // Ohne Versionsnummer gibt es kein Update: 428 Precondition Required
  if (!ifMatch) {
    return problemDetails(c, 428, "Precondition Required", "If-Match Header erforderlich");
  }

  // Aktuellen Datensatz suchen
  const [existingBook] = await db.select().from(books).where(eq(books.id, id)).limit(1);

  if (!existingBook) {
    return problemDetails(c, 404, "Not Found", "Buch nicht gefunden");
  }

  // Erwartete Version überprüfen
  const expectedEtag = `"${existingBook.version}"`;

  // Der Client hat eine veraltete Version: 412 Precondition Failed
  if (ifMatch !== expectedEtag && ifMatch !== "*") {
    return problemDetails(
      c,
      412,
      "Precondition Failed",
      "Ressource wurde zwischenzeitlich geändert",
    );
  }

  // Destructuring: bei PATCH kann title fehlen (undefined)
  const { title } = values;

  // Atomisches Update mit Versionsprüfung
  const [updatedBook] = await db
    .update(books)
    .set({
      // title nur setzen, wenn er im Request-Body enthalten ist
      ...(title !== undefined && { title }),
      // Versionsnummer in der DB hochzählen und Zeitstempel für UPDATE setzen
      version: sql`${books.version} + 1`,
      updatedAt: new Date(),
    })
    // WHERE id = ? AND version = ?: falls ein anderer Request inzwischen geändert hat,
    // wird kein Datensatz gefunden und nichts überschrieben
    .where(and(eq(books.id, id), eq(books.version, existingBook.version)))
    .returning();

  // Kein Datensatz geändert: ein paralleler Request war schneller
  if (!updatedBook) {
    return problemDetails(
      c,
      412,
      "Precondition Failed",
      "Lost Update verhindert: Version veraltet",
    );
  }

  // Neue Versionsnummer als ETag für das nächste Update zurückgeben
  c.header("ETag", `"${updatedBook.version}"`);

  return c.json(updatedBook, 200);
};

// PUT: Buch vollständig aktualisieren
booksRouter.put(
  "/:id",
  // 1. Zugriffsschutz: 401 ohne gültigen Token, 403 ohne die Rolle admin
  rolesRequired("admin"),
  // 2. Validierung des Request-Bodys: 400 mit den Fehlern von Zod
  zValidator("json", updateBookSchema, (result, c) => {
    if (!result.success) {
      return validationProblem(c, result.error);
    }
  }),
  // 3. Eigentliches Update mit dem validierten Body
  (c) => updateBook(c, c.req.valid("json")),
);

// PATCH: Buch teilweise aktualisieren
booksRouter.patch(
  "/:id",
  // 1. Zugriffsschutz: 401 ohne gültigen Token, 403 ohne die Rolle admin
  rolesRequired("admin"),
  // 2. Validierung des Request-Bodys: 400 mit den Fehlern von Zod
  zValidator("json", patchBookSchema, (result, c) => {
    if (!result.success) {
      return validationProblem(c, result.error);
    }
  }),
  // 3. Eigentliches Update mit dem validierten Body
  (c) => updateBook(c, c.req.valid("json")),
);
