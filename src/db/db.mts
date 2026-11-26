// DB-Zugriff: Connection Pool von pg und darauf aufbauend das Drizzle-Objekt "db"

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.mts";

// Connection Pool: Verbindungen zur DB werden wiederverwendet statt pro Request neu aufgebaut.
// DATABASE_URL steht in .env und wird von Bun automatisch geladen.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // höchstens 10 gleichzeitige Verbindungen
  max: 10,
  // unbenutzte Verbindungen nach 30 Sekunden schließen
  idleTimeoutMillis: 30000,
});

// Ohne diesen Listener beendet ein Verbindungsabbruch (z.B. DB-Neustart) den ganzen Server
pool.on("error", (err) => {
  console.error("PostgreSQL-Verbindung verloren:", err.message);
});

// "schema" (Tabellen und Relationen) ist für db.query.<tabelle> erforderlich
// casing "snake_case": Property createdAt in TypeScript <-> Spalte created_at in der DB
export const db = drizzle(pool, { schema, casing: "snake_case" });
