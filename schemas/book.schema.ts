import { z } from "zod";

// Validierung für neue Bücher
export const createBookSchema = z.object({
  title: z.string().trim().min(1, "Titel ist erforderlich").max(255),
});

// Validierung für neue Kapitel
export const createChapterSchema = z.object({
  chapterNumber: z.number().int().positive(),
  title: z.string().trim().min(1, "Kapiteltitel ist erforderlich"),
});

// PUT: vollständige Aktualisierung
export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
  })
  .strict();

// PATCH: teilweise Aktualisierung
export const patchBookSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Mindestens ein Feld muss angegeben werden.",
  });
