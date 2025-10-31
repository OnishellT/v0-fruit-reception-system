/**
 * Validation schemas for Quality Evaluation feature
 * File: lib/utils/quality-validations.ts
 * Date: 2025-10-31
 */

import { z } from "zod";

// Validation schemas
export const createQualitySchema = z.object({
  recepcion_id: z.string().uuid("Invalid reception ID"),
  violetas: z.number().min(0, "Violetas must be at least 0").max(100, "Violetas cannot exceed 100"),
  humedad: z.number().min(0, "Humedad must be at least 0").max(100, "Humedad cannot exceed 100"),
  moho: z.number().min(0, "Moho must be at least 0").max(100, "Moho cannot exceed 100"),
});

export const updateQualitySchema = z.object({
  violetas: z.number().min(0, "Violetas must be at least 0").max(100, "Violetas cannot exceed 100").optional(),
  humedad: z.number().min(0, "Humedad must be at least 0").max(100, "Humedad cannot exceed 100").optional(),
  moho: z.number().min(0, "Moho must be at least 0").max(100, "Moho cannot exceed 100").optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);
