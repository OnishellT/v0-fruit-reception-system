-- Create unified quality thresholds table
CREATE TABLE IF NOT EXISTS "quality_thresholds" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "fruit_type_id" uuid NOT NULL,
    "metric" varchar(50) NOT NULL,
    "threshold_percent" numeric(5, 2) NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "created_by" uuid,
    "updated_by" uuid,
    CONSTRAINT "quality_thresholds_fruit_type_id_metric_unique" UNIQUE("fruit_type_id","metric")
);

DO $$ BEGIN
 ALTER TABLE "quality_thresholds" ADD CONSTRAINT "quality_thresholds_fruit_type_id_fruit_types_id_fk" FOREIGN KEY ("fruit_type_id") REFERENCES "fruit_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quality_thresholds" ADD CONSTRAINT "quality_thresholds_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quality_thresholds" ADD CONSTRAINT "quality_thresholds_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_quality_thresholds_fruit_type" ON "quality_thresholds" ("fruit_type_id");
CREATE INDEX IF NOT EXISTS "idx_quality_thresholds_enabled" ON "quality_thresholds" ("enabled");
