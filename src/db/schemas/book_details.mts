import {
    pgTable,
    serial,
    integer,
    text,
    varchar,
} from 'drizzle-orm/pg-core'

import { relations } from 'drizzle-orm'
import { books } from './books.mts'

export const bookDetails = pgTable('book_details', {
    id: serial('id').primaryKey(),

    bookId: integer('book_id')
        .notNull()
        .unique()
        .references(() => books.id, {
            onDelete: 'cascade',
        }),

    isbn: varchar('isbn', { length: 20 }),
    description: text('description'),
})

export const bookDetailsRelations = relations(
    bookDetails,
    ({ one }) => ({
        book: one(books, {
            fields: [bookDetails.bookId],
            references: [books.id],
        }),
    }),
)
