// Relationen für Drizzle: sie sind keine DB-Constraints, sondern ermöglichen
// Abfragen wie db.query.books.findFirst({ with: { details: true, chapters: true } })

import { relations } from "drizzle-orm";

import { books } from "./schemas/books.mts";
import { bookDetails } from "./schemas/book_details.mts";
import { chapters } from "./schemas/chapters.mts";

// Ein Buch hat genau einen Datensatz mit Details (1:1) und beliebig viele Kapitel (1:N)
// Book Relations
export const booksRelations = relations(books, ({ one, many }) => ({
  details: one(bookDetails),
  chapters: many(chapters),
}));

// Gegenrichtung der 1:1-Beziehung: der Fremdschlüssel book_id steht in book_details
// Book Details Relations
export const bookDetailsRelations = relations(bookDetails, ({ one }) => ({
  book: one(books, {
    fields: [bookDetails.bookId],
    references: [books.id],
  }),
}));

// Gegenrichtung der 1:N-Beziehung: der Fremdschlüssel book_id steht in chapters
// Chapters Relations
export const chaptersRelations = relations(chapters, ({ one }) => ({
  book: one(books, {
    fields: [chapters.bookId],
    references: [books.id],
  }),
}));
