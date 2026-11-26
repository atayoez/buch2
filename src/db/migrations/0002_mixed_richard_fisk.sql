ALTER TABLE "book_details" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;