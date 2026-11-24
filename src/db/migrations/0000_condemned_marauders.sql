CREATE TABLE "book_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"isbn" varchar(20),
	"description" text,
	CONSTRAINT "book_details_book_id_unique" UNIQUE("book_id")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_details" ADD CONSTRAINT "book_details_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;