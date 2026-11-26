// Tabelle "book_details": 1:1-Beziehung zu "books"

import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";

import { books } from "./books.mts";

export const bookDetails = pgTable("book_details", {
  // Generierter Primärschlüssel
  id: serial("id").primaryKey().unique().notNull(),

  // Fremdschlüssel auf books. unique() macht daraus eine 1:1-Beziehung:
  // zu einem Buch gibt es höchstens einen Datensatz mit Details.
  // onDelete cascade: mit dem Buch werden auch die Details gelöscht
  bookId: integer("book_id")
    .notNull()
    .unique()
    .references(() => books.id, {
      onDelete: "cascade",
    }),

  // Optionale Zusatzdaten
  isbn: varchar("isbn", { length: 20 }),
  description: text("description"),
  // Zeitstempel für INSERT und UPDATE
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
