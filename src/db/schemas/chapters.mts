import {
    pgTable,
    serial,
    integer,
    text,
} from 'drizzle-orm/pg-core'

import { relations } from 'drizzle-orm'
import { books } from './books.mts'

export const chapters = pgTable('chapters', {
    id: serial('id').primaryKey(),

    bookId: integer('book_id')
        .notNull()
        .references(() => books.id, {
            onDelete: 'cascade',
        }),

    chapterNumber: integer('chapter_number').notNull(),
    title: text('title').notNull(),
})

export const chaptersRelations = relations(
    chapters,
    ({ one }) => ({
        book: one(books, {
            fields: [chapters.bookId],
            references: [books.id],
        }),
    }),
)
