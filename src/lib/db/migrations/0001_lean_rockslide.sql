CREATE TABLE "calidad_cafe" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recepcion_id" uuid NOT NULL,
	"violetas" numeric NOT NULL,
	"humedad" numeric NOT NULL,
	"moho" numeric NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calidad_cafe" ADD CONSTRAINT "calidad_cafe_recepcion_id_receptions_id_fk" FOREIGN KEY ("recepcion_id") REFERENCES "public"."receptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calidad_cafe" ADD CONSTRAINT "calidad_cafe_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calidad_cafe" ADD CONSTRAINT "calidad_cafe_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;