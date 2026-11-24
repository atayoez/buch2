
import { reset, seed } from 'drizzle-seed'

import { books } from '../src/db/schemas/books.mts'
import { bookDetails } from '../src/db/schemas/book_details.mts'
import { chapters } from '../src/db/schemas/chapters.mts'

import { db, pool } from '../src/db/db.mts'

export const seedDb = async () => {
    // Alle drei Tabellen zurücksetzen
    await reset(db, {
        books,
        bookDetails,
        chapters,
    })

    // Ausschließlich Bücher generieren
    await seed(db, { books }).refine((funcs) => ({
        books: {
            count: 10,
            columns: {
                title: funcs.valuesFromArray({
                    values: [
                        'Clean Code',
                        'The Pragmatic Programmer',
                        'Design Patterns',
                        'Refactoring',
                        'Domain-Driven Design',
                        'Clean Architecture',
                        'You Dont Know JS',
                        'Effective TypeScript',
                        'JavaScript: The Good Parts',
                        'The Art of Computer Programming',
                    ],
                    isUnique: true,
                }),
            },
        },
    }))

    // Bücher laden
    const bookRows = await db
        .select({
            id: books.id,
            title: books.title,
        })
        .from(books)

    // Buchdetails und Kapitel manuell generieren
    await db.transaction(async (tx) => {
        for (const book of bookRows) {
            // 1:1 Beziehung
            await tx.insert(bookDetails).values({
                bookId: book.id,
                isbn: `978-3-${String(book.id).padStart(10, '0')}`,
                description: `Zusätzliche Informationen zu "${book.title}".`,
            })

            // 1:N Beziehung
            const chapterTitles = [
                'Einleitung',
                'Grundlagen',
                'Fortgeschrittene Konzepte',
                'Praktische Beispiele',
                'Zusammenfassung',
            ]

            await tx.insert(chapters).values(
                chapterTitles.map((title, index) => ({
                    bookId: book.id,
                    chapterNumber: index + 1,
                    title,
                })),
            )
        }
    })

    console.log('Database seeded successfully!')
    console.log(`Books: ${bookRows.length}`)
    console.log(`Book details: ${bookRows.length}`)
    console.log(`Chapters: ${bookRows.length * 5}`)
}

seedDb()
    .catch((error) => {
        console.error('Database seed failed:', error)
        process.exitCode = 1
    })
    .finally(async () => {
        await pool.end()
    })
