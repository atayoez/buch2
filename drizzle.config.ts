// Konfiguration für drizzle-kit: bun run db:generate:migration, db:migrate, db:studio

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Verzeichnis für die generierten SQL-Migrationen
  out: "./src/db/migrations",
  // Tabellen-Definitionen, aus denen drizzle-kit die Migrationen berechnet
  schema: "./src/db/schemas/*.mts",
  dialect: "postgresql",
  // strict: Rückfrage vor riskanten Änderungen, verbose: SQL-Anweisungen ausgeben
  strict: true,
  verbose: true,
  // DATABASE_URL aus .env
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
