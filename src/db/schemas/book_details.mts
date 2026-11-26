import {
    pgTable,
    serial,
    integer,
    text,
    varchar,
    timestamp
} from 'drizzle-orm/pg-core'

import { books } from './books.mts'

export const bookDetails = pgTable('book_details', {
    id: serial('id').primaryKey().unique().notNull(),

    bookId: integer('book_id')
        .notNull()
        .unique()
        .references(() => books.id, {
            onDelete: 'cascade',
        }),

    isbn: varchar('isbn', { length: 20 }),
    description: text('description'),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
})
