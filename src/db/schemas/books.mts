// Tabelle "books": die Haupttabelle der Domäne

import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const books = pgTable("books", {
  // Generierter Primärschlüssel: serial = Integer mit Sequenz
  id: serial("id").primaryKey().unique().notNull(),
  // Titel des Buchs, Pflichtfeld
  title: text("title").notNull(),
  // Versionsnummer für optimistische Synchronisation (ETag / If-Match)
  version: integer("version").default(0).notNull(),
  // Zeitstempel für INSERT: wird von der DB mit now() gesetzt
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Zeitstempel für UPDATE: wird beim Ändern in routes/books.mts neu gesetzt
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
