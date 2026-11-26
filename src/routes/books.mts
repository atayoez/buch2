import { Hono } from "hono";
import { eq, asc, and, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { createHash } from "node:crypto";

import { db } from "../db/db.mts";
import { books } from "../db/schemas/books.mts";
import { chapters } from "../db/schemas/chapters.mts";

import { createBookSchema, createChapterSchema, updateBookSchema } from "../schemas/book.schema.ts";

import { validationProblem, problemDetails } from "../utils/problem-details.mts";

const booksRouter = new Hono();

// GET: Alle Bücher abrufen
booksRouter.get("/", async (c) => {
  const result = await db.select().from(books);

  return c.json(result);
});

// GET: Einzelnes Buch inklusive Details und Kapiteln
// Bedingter GET-Request mit ETag und If-None-Match
booksRouter.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return problemDetails(c, 400, "Bad Request", "Ungültige Buch-ID");
  }

  const result = await db.query.books.findFirst({
    where: eq(books.id, id),
    with: {
      details: true,
      chapters: {
        orderBy: [asc(chapters.chapterNumber)],
      },
    },
  });

  if (!result) {
    return problemDetails(c, 404, "Not Found", "Buch nicht gefunden");
  }

  // ETag anhand der Ressourcendaten erzeugen
  const etag = `"${createHash("sha256").update(JSON.stringify(result)).digest("hex")}"`;

  c.header("ETag", etag);

  // If-None-Match überprüfen
  const ifNoneMatch = c.req.header("If-None-Match");

  const matches =
    ifNoneMatch === "*" ||
    ifNoneMatch?.split(",").some((value) => value.trim().replace(/^W\//, "") === etag);

  if (matches) {
    return c.body(null, 304);
  }

  return c.json(result, 200);
});

// POST: Neues Buch erstellen
booksRouter.post(
  "/",
  zValidator("json", createBookSchema, (result, c) => {
    if (!result.success) {
      return validationProblem(c, result.error);
    }
  }),
  async (c) => {
    const body = c.req.valid("json");

    const [newBook] = await db
      .insert(books)
      .values({
        title: body.title,
      })
      .returning();

    if (!newBook) {
      return problemDetails(c, 500, "Internal Server Error", "Buch konnte nicht erstellt werden");
    }

    return c.json(newBook, 201, {
      Location: `/books/${newBook.id}`,
    });
  },
);

// POST: Kapitel zu einem Buch hinzufügen
booksRouter.post(
  "/:id/chapters",
  zValidator("json", createChapterSchema, (result, c) => {
    if (!result.success) {
      return validationProblem(c, result.error);
    }
  }),
  async (c) => {
    const bookId = Number(c.req.param("id"));

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return problemDetails(c, 400, "Bad Request", "Ungültige Buch-ID");
    }

    const body = c.req.valid("json");

    const [existingBook] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);

    if (!existingBook) {
      return problemDetails(c, 404, "Not Found", "Buch nicht gefunden");
    }

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

    return c.json(newChapter, 201, {
      Location: `/books/${bookId}/chapters/${newChapter.id}`,
    });
  },
);

// PUT: Buch vollständig aktualisieren
booksRouter.put(
  "/:id",
  zValidator("json", updateBookSchema, (result, c) => {
    if (!result.success) {
      return validationProblem(c, result.error);
    }
  }),
  async (c) => {
    const id = Number(c.req.param("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return problemDetails(c, 400, "Bad Request", "Ungültige Buch-ID");
    }

    const body = c.req.valid("json");

    // If-Match auslesen
    const ifMatch = c.req.header("If-Match");

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

    if (ifMatch !== expectedEtag && ifMatch !== "*") {
      return problemDetails(
        c,
        412,
        "Precondition Failed",
        "Ressource wurde zwischenzeitlich geändert",
      );
    }

    // Atomisches Update mit Versionsprüfung
    const [updatedBook] = await db
      .update(books)
      .set({
        title: body.title,
        version: sql`${books.version} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(books.id, id), eq(books.version, existingBook.version)))
      .returning();

    if (!updatedBook) {
      return problemDetails(
        c,
        412,
        "Precondition Failed",
        "Lost Update verhindert: Version veraltet",
      );
    }

    c.header("ETag", `"${updatedBook.version}"`);

    return c.json(updatedBook, 200);
  },
);

export default booksRouter;
