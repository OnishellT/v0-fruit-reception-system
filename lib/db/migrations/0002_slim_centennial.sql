CREATE TABLE "cash_customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"national_id" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_daily_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"fruit_type_id" integer NOT NULL,
	"price_date" date NOT NULL,
	"price_per_kg" numeric(12, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(64) NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_fruit_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(64) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cash_fruit_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cash_quality_thresholds" (
	"id" serial PRIMARY KEY NOT NULL,
	"fruit_type_id" integer NOT NULL,
	"metric" varchar(32) NOT NULL,
	"threshold_percent" numeric(5, 2) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_quality_thresholds_unique" (
	"fruit_type_id" integer NOT NULL,
	"metric" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_receptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"fruit_type_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"reception_date" timestamp with time zone DEFAULT now() NOT NULL,
	"containers_count" integer DEFAULT 0 NOT NULL,
	"total_weight_kg_original" numeric(12, 3) NOT NULL,
	"price_per_kg_snapshot" numeric(12, 4) NOT NULL,
	"calidad_humedad" numeric(5, 2),
	"calidad_moho" numeric(5, 2),
	"calidad_violetas" numeric(5, 2),
	"discount_percent_total" numeric(6, 3) DEFAULT '0' NOT NULL,
	"discount_weight_kg" numeric(12, 3) DEFAULT '0' NOT NULL,
	"total_weight_kg_final" numeric(12, 3) NOT NULL,
	"gross_amount" numeric(14, 4) NOT NULL,
	"net_amount" numeric(14, 4) NOT NULL,
	"discount_breakdown" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(64) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_daily_prices" ADD CONSTRAINT "cash_daily_prices_fruit_type_id_cash_fruit_types_id_fk" FOREIGN KEY ("fruit_type_id") REFERENCES "public"."cash_fruit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_quality_thresholds" ADD CONSTRAINT "cash_quality_thresholds_fruit_type_id_cash_fruit_types_id_fk" FOREIGN KEY ("fruit_type_id") REFERENCES "public"."cash_fruit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_quality_thresholds_unique" ADD CONSTRAINT "cash_quality_thresholds_unique_fruit_type_id_cash_fruit_types_id_fk" FOREIGN KEY ("fruit_type_id") REFERENCES "public"."cash_fruit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_receptions" ADD CONSTRAINT "cash_receptions_fruit_type_id_cash_fruit_types_id_fk" FOREIGN KEY ("fruit_type_id") REFERENCES "public"."cash_fruit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_receptions" ADD CONSTRAINT "cash_receptions_customer_id_cash_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."cash_customers"("id") ON DELETE no action ON UPDATE no action;