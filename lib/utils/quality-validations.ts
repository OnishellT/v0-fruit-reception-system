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
});

// Custom validation function for create quality
export function validateCreateQuality(data: any) {
  const result = createQualitySchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || "Validation failed",
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

// Custom validation function for update quality
export function validateUpdateQuality(data: any) {
  // Check if at least one field is provided
  const hasAtLeastOneField =
    data.violetas !== undefined || data.humedad !== undefined || data.moho !== undefined;

  if (!hasAtLeastOneField) {
    return {
      success: false,
      error: "At least one field must be provided",
    };
  }

  const result = updateQualitySchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || "Validation failed",
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
