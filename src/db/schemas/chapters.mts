import {
    pgTable,
    serial,
    integer,
    text,
} from 'drizzle-orm/pg-core'


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
