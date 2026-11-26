import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.mts";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

// Ohne diesen Listener beendet ein Verbindungsabbruch (z.B. DB-Neustart) den ganzen Server
pool.on("error", (err) => {
  console.error("PostgreSQL-Verbindung verloren:", err.message);
});

// "schema" (Tabellen und Relationen) ist für db.query.<tabelle> erforderlich
export const db = drizzle(pool, { schema, casing: "snake_case" });
