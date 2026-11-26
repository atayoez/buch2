import {
    pgTable,
    serial,
    integer,
    text,
    timestamp
} from 'drizzle-orm/pg-core'


import { books } from './books.mts'

export const chapters = pgTable('chapters', {
    id: serial('id').primaryKey().unique().notNull(),

    bookId: integer('book_id')
        .notNull()
        .references(() => books.id, {
            onDelete: 'cascade',
        }),

    chapterNumber: integer('chapter_number').notNull(),
    title: text('title').notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
})
