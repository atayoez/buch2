// Zod-Schemas für die Request-Bodies der Bücher-Routen.
// Sie validieren zur Laufzeit und liefern zugleich die TypeScript-Typen für c.req.valid("json")

import { z } from "zod";

// Validierung für neue Bücher
export const createBookSchema = z.object({
  // Leerzeichen am Rand entfernen, danach 1 bis 255 Zeichen
  title: z.string().trim().min(1, "Titel ist erforderlich").max(255),
});

// Validierung für neue Kapitel
export const createChapterSchema = z.object({
  // positive ganze Zahl, d.h. ab 1
  chapterNumber: z.number().int().positive(),
  title: z.string().trim().min(1, "Kapiteltitel ist erforderlich"),
});

// PUT: vollständige Aktualisierung
export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
  })
  // strict: unbekannte Properties im Body sind ein Fehler statt ignoriert zu werden
  .strict();

// PATCH: teilweise Aktualisierung
export const patchBookSchema = z
  .object({
    // optional: bei PATCH muss nicht jedes Feld mitgeschickt werden
    title: z.string().trim().min(1).max(255).optional(),
  })
  .strict()
  // Ein leerer Body {} wäre gültig, würde aber nichts ändern: deshalb zusätzliche Prüfung
  .refine((data) => Object.keys(data).length > 0, {
    message: "Mindestens ein Feld muss angegeben werden.",
  });
