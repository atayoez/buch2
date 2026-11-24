import {
    pgTable,
    serial,
    text,
    timestamp,
} from 'drizzle-orm/pg-core'

import { relations } from 'drizzle-orm'
import { bookDetails } from './book_details.mts'
import { chapters } from './chapters.mts'

export const books = pgTable('books', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at')
        .defaultNow()
        .notNull(),
})

export const booksRelations = relations(books, ({ one, many }) => ({
    details: one(bookDetails),
    chapters: many(chapters),
}))
