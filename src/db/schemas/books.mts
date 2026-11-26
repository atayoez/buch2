import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const books = pgTable("books", {
  id: serial("id").primaryKey().unique().notNull(),
  title: text("title").notNull(),
  // Versionsnummer für optimistische Synchronisation (ETag / If-Match)
  version: integer("version").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
