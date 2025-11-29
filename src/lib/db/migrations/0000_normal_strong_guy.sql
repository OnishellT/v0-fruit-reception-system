CREATE TABLE "asociaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(255) NOT NULL,
	"table_name" varchar(255),
	"record_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(255),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "batch_receptions" (
	"batch_id" uuid NOT NULL,
	"reception_id" uuid NOT NULL,
	"wet_weight_contribution" numeric,
	"percentage_of_total" numeric,
	"proportional_dried_weight" numeric,
	CONSTRAINT "batch_receptions_batch_id_reception_id_pk" PRIMARY KEY("batch_id","reception_id")
);
--> statement-breakpoint
CREATE TABLE "cacao_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_type" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"duration" integer NOT NULL,
	"total_wet_weight" numeric,
	"total_dried_weight" numeric,
	"status" text DEFAULT 'In progress' NOT NULL,
	"expected_completion_date" timestamp with time zone,
	"total_sacos_70kg" integer,
	"remainder_kg" numeric
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "desglose_descuentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recepcion_id" uuid NOT NULL,
	"parametro" varchar(255) NOT NULL,
	"umbral" numeric NOT NULL,
	"valor" numeric NOT NULL,
	"porcentaje_descuento" numeric NOT NULL,
	"peso_descuento" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_thresholds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pricing_rule_id" uuid NOT NULL,
	"quality_metric" varchar(255) NOT NULL,
	"limit_value" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"license_number" varchar(255),
	"phone" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fruit_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(255) NOT NULL,
	"subtype" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "laboratory_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reception_id" uuid,
	"sample_weight" numeric NOT NULL,
	"estimated_drying_days" integer NOT NULL,
	"status" text DEFAULT 'Drying' NOT NULL,
	"dried_sample_kg" numeric,
	"violetas_percentage" numeric,
	"moho_percentage" numeric,
	"basura_percentage" numeric
);
--> statement-breakpoint
CREATE TABLE "pricing_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reception_id" uuid NOT NULL,
	"base_price_per_kg" numeric NOT NULL,
	"total_weight" numeric NOT NULL,
	"gross_value" numeric NOT NULL,
	"total_discount_amount" numeric DEFAULT '0' NOT NULL,
	"final_total" numeric NOT NULL,
	"calculation_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fruit_type" varchar(255) NOT NULL,
	"quality_based_pricing_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "provider_certifications" (
	"provider_id" uuid NOT NULL,
	"certification_id" uuid NOT NULL,
	"issued_date" date,
	"expiry_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "provider_certifications_provider_id_certification_id_pk" PRIMARY KEY("provider_id","certification_id")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"phone" varchar(255),
	"address" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"asociacion_id" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quality_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recepcion_id" uuid NOT NULL,
	"violetas" numeric,
	"humedad" numeric,
	"moho" numeric,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reception_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reception_id" uuid NOT NULL,
	"fruit_type_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"weight_kg" numeric NOT NULL,
	"line_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"original_weight" numeric DEFAULT '0',
	"discounted_weight" numeric DEFAULT '0',
	"discount_percentage" numeric DEFAULT '0',
	"lab_sample_adjustment" numeric DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "receptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reception_number" varchar(255) NOT NULL,
	"provider_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"truck_plate" varchar(255) NOT NULL,
	"total_containers" integer NOT NULL,
	"reception_date" date DEFAULT now() NOT NULL,
	"reception_time" time DEFAULT now() NOT NULL,
	"status" varchar(255) DEFAULT 'draft',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"fruit_type_id" uuid,
	"synced_to_dashboard" boolean DEFAULT false NOT NULL,
	"pricing_calculation_id" uuid,
	"total_peso_original" numeric DEFAULT '0',
	"total_peso_descuento" numeric DEFAULT '0',
	"total_peso_final" numeric DEFAULT '0',
	"lab_sample_wet_weight" numeric,
	"lab_sample_dried_weight" numeric,
	"total_peso_dried" numeric,
	"f_batch_id" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "weight_discount_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reception_id" uuid NOT NULL,
	"calculation_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_receptions" ADD CONSTRAINT "batch_receptions_batch_id_cacao_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."cacao_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_receptions" ADD CONSTRAINT "batch_receptions_reception_id_receptions_id_fk" FOREIGN KEY ("reception_id") REFERENCES "public"."receptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desglose_descuentos" ADD CONSTRAINT "desglose_descuentos_recepcion_id_receptions_id_fk" FOREIGN KEY ("recepcion_id") REFERENCES "public"."receptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desglose_descuentos" ADD CONSTRAINT "desglose_descuentos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_thresholds" ADD CONSTRAINT "discount_thresholds_pricing_rule_id_pricing_rules_id_fk" FOREIGN KEY ("pricing_rule_id") REFERENCES "public"."pricing_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_thresholds" ADD CONSTRAINT "discount_thresholds_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_thresholds" ADD CONSTRAINT "discount_thresholds_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laboratory_samples" ADD CONSTRAINT "laboratory_samples_reception_id_receptions_id_fk" FOREIGN KEY ("reception_id") REFERENCES "public"."receptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_calculations" ADD CONSTRAINT "pricing_calculations_reception_id_receptions_id_fk" FOREIGN KEY ("reception_id") REFERENCES "public"."receptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_calculations" ADD CONSTRAINT "pricing_calculations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_certifications" ADD CONSTRAINT "provider_certifications_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_certifications" ADD CONSTRAINT "provider_certifications_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_asociacion_id_asociaciones_id_fk" FOREIGN KEY ("asociacion_id") REFERENCES "public"."asociaciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_evaluations" ADD CONSTRAINT "quality_evaluations_recepcion_id_receptions_id_fk" FOREIGN KEY ("recepcion_id") REFERENCES "public"."receptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_evaluations" ADD CONSTRAINT "quality_evaluations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_evaluations" ADD CONSTRAINT "quality_evaluations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reception_details" ADD CONSTRAINT "reception_details_reception_id_receptions_id_fk" FOREIGN KEY ("reception_id") REFERENCES "public"."receptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reception_details" ADD CONSTRAINT "reception_details_fruit_type_id_fruit_types_id_fk" FOREIGN KEY ("fruit_type_id") REFERENCES "public"."fruit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receptions" ADD CONSTRAINT "receptions_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receptions" ADD CONSTRAINT "receptions_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receptions" ADD CONSTRAINT "receptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receptions" ADD CONSTRAINT "receptions_fruit_type_id_fruit_types_id_fk" FOREIGN KEY ("fruit_type_id") REFERENCES "public"."fruit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receptions" ADD CONSTRAINT "receptions_pricing_calculation_id_pricing_calculations_id_fk" FOREIGN KEY ("pricing_calculation_id") REFERENCES "public"."pricing_calculations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receptions" ADD CONSTRAINT "receptions_f_batch_id_cacao_batches_id_fk" FOREIGN KEY ("f_batch_id") REFERENCES "public"."cacao_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_discount_calculations" ADD CONSTRAINT "weight_discount_calculations_reception_id_receptions_id_fk" FOREIGN KEY ("reception_id") REFERENCES "public"."receptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_discount_calculations" ADD CONSTRAINT "weight_discount_calculations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;