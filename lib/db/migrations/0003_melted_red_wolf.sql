CREATE TABLE "daily_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fruit_type_id" uuid NOT NULL,
	"price_date" date NOT NULL,
	"price_per_kg" numeric(12, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_prices" ADD CONSTRAINT "daily_prices_fruit_type_id_fruit_types_id_fk" FOREIGN KEY ("fruit_type_id") REFERENCES "public"."fruit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_prices" ADD CONSTRAINT "daily_prices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;