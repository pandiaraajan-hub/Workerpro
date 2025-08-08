CREATE TABLE "certifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" varchar NOT NULL,
	"course_id" varchar NOT NULL,
	"name" text NOT NULL,
	"certificate_number" text,
	"issued_date" timestamp,
	"expiry_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration" integer,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" text,
	"serial_number" text,
	"workers_id" text NOT NULL,
	"name_of_workers" text NOT NULL,
	"designation" text,
	"contact_no" text,
	"nationality" text,
	"wp_no" text,
	"nric_fin_no" text,
	"date_of_expiry" timestamp,
	"date_of_birth" timestamp,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "workers_workers_id_unique" UNIQUE("workers_id")
);
--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;