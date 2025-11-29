ALTER TABLE "receptions" DROP CONSTRAINT "receptions_pricing_calculation_id_pricing_calculations_id_fk";
--> statement-breakpoint
ALTER TABLE "laboratory_samples" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "laboratory_samples" ADD CONSTRAINT "laboratory_samples_batch_id_cacao_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."cacao_batches"("id") ON DELETE no action ON UPDATE no action;