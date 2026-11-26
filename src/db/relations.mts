import { relations } from "drizzle-orm";

import { books } from "./schemas/books.mts";
import { bookDetails } from "./schemas/book_details.mts";
import { chapters } from "./schemas/chapters.mts";

// Book Relations
export const booksRelations = relations(books, ({ one, many }) => ({
  details: one(bookDetails),
  chapters: many(chapters),
}));

// Book Details Relations
export const bookDetailsRelations = relations(bookDetails, ({ one }) => ({
  book: one(books, {
    fields: [bookDetails.bookId],
    references: [books.id],
  }),
}));

// Chapters Relations
export const chaptersRelations = relations(chapters, ({ one }) => ({
  book: one(books, {
    fields: [chapters.bookId],
    references: [books.id],
  }),
}));
