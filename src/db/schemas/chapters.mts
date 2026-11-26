// Tabelle "chapters": 1:N-Beziehung zu "books"

import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

import { books } from "./books.mts";

export const chapters = pgTable("chapters", {
  // Generierter Primärschlüssel
  id: serial("id").primaryKey().unique().notNull(),

  // Fremdschlüssel auf books, ohne unique(): ein Buch kann viele Kapitel haben (1:N).
  // onDelete cascade: mit dem Buch werden auch die Kapitel gelöscht
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, {
      onDelete: "cascade",
    }),

  // Nummer und Titel des Kapitels, beides Pflichtfelder
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  // Zeitstempel für INSERT und UPDATE
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
