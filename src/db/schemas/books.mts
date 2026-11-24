import {
    pgTable,
    serial,
    text,
    timestamp,
} from 'drizzle-orm/pg-core'

export const books = pgTable('books', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at')
        .defaultNow()
        .notNull(),
})
