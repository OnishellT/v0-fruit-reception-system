import { z } from 'zod';

export const CacaoBatchSchema = z.object({
  id: z.string().uuid(),
  batch_type: z.string(),
  start_date: z.string().datetime(),
  duration: z.number().int(),
  total_wet_weight: z.number().nullable(),
  total_dried_weight: z.number().nullable(),
  status: z.string(),
  expected_completion_date: z.string().datetime().nullable(),
  total_sacos_70kg: z.number().int().nullable(),
  remainder_kg: z.number().nullable(),
});

export const BatchReceptionSchema = z.object({
  batch_id: z.string().uuid(),
  reception_id: z.string().uuid(),
  wet_weight_contribution: z.number().nullable(),
  percentage_of_total: z.number().nullable(),
  proportional_dried_weight: z.number().nullable(),
});

export const LaboratorySampleSchema = z.object({
  id: z.string().uuid(),
  reception_id: z.string().uuid(),
  sample_weight: z.number(),
  estimated_drying_days: z.number().int(),
  status: z.string(),
  dried_sample_kg: z.number().nullable(),
  violetas_percentage: z.number().nullable(),
  moho_percentage: z.number().nullable(),
  basura_percentage: z.number().nullable(),
});

export const CreateCacaoBatchSchema = z.object({
  reception_ids: z.array(z.string().uuid()).min(1, "At least one reception must be selected"),
  batch_type: z.string(),
  start_date: z.string().datetime(),
  duration: z.number().int(),
});

export const UpdateCacaoBatchSchema = z.object({
  total_sacos_70kg: z.number().int(),
  remainder_kg: z.number(),
});

export const CreateLaboratorySampleSchema = z.object({
  sample_weight: z.number(),
  estimated_drying_days: z.number().int(),
});

export const UpdateLaboratorySampleSchema = z.object({
  dried_sample_kg: z.number(),
  violetas_percentage: z.number(),
  moho_percentage: z.number(),
  basura_percentage: z.number(),
});
