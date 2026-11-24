ALTER TABLE "book_details" ADD CONSTRAINT "book_details_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_id_unique" UNIQUE("id");