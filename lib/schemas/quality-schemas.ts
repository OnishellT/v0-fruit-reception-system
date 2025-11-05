import { z } from "zod";

// Validation schemas for quality evaluations
export const createQualitySchema = z.object({
  recepcion_id: z.string().uuid(),
  violetas: z.number().min(0).max(100).optional(),
  humedad: z.number().min(0).max(100).optional(),
  moho: z.number().min(0).max(100).optional(),
});

// Custom validation function
export function validateCreateQuality(data: any) {
  const hasAtLeastOneMetric =
    data.violetas !== undefined || data.humedad !== undefined || data.moho !== undefined;

  if (!hasAtLeastOneMetric) {
    return {
      success: false,
      error: "At least one quality metric must be provided",
    };
  }

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

export const updateQualitySchema = z.object({
  violetas: z.number().min(0).max(100).optional(),
  humedad: z.number().min(0).max(100).optional(),
  moho: z.number().min(0).max(100).optional(),
});

// Custom validation function
export function validateUpdateQuality(data: any) {
  const hasAtLeastOneMetric =
    data.violetas !== undefined || data.humedad !== undefined || data.moho !== undefined;

  if (!hasAtLeastOneMetric) {
    return {
      success: false,
      error: "At least one quality metric must be provided",
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
