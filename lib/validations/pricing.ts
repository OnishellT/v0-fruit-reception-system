// Zod validation schemas for Quality-Based Pricing System
// File: lib/validations/pricing.ts
// Date: 2025-10-31

import { z } from 'zod';

// ==============================
// Quality Metrics
// ==============================

export const QualityMetricSchema = z.enum(['Violetas', 'Humedad', 'Moho']);
export const FruitTypeSchema = z.enum(['CAFÉ', 'CACAO', 'MIEL', 'COCOS']);

// ==============================
// Core Schemas
// ==============================

/**
 * Discount threshold schema
 */
export const DiscountThresholdSchema = z.object({
  id: z.string().uuid().optional(),
  pricing_rule_id: z.string().uuid(),
  quality_metric: QualityMetricSchema,
  limit_value: z.number().min(0).max(100), // Quality limit percentage (0-100)
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().optional(),
  updated_by: z.string().uuid().optional()
});

/**
 * Pricing rule schema
 */
export const PricingRuleSchema = z.object({
  id: z.string().uuid().optional(),
  fruit_type: FruitTypeSchema,
  quality_based_pricing_enabled: z.boolean(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().optional(),
  updated_by: z.string().uuid().optional(),
  discount_thresholds: z.array(DiscountThresholdSchema).optional()
});

/**
 * Pricing calculation data schema (JSONB structure)
 */
export const PricingCalculationDataSchema = z.object({
  quality_metrics: z.array(z.object({
    metric: z.string(),
    value: z.number(),
    discount_percentage: z.number(),
    discount_amount: z.number()
  })),
   total_discounts: z.number(),
   timestamp: z.string(),
   fruit_type: z.string(),
   applied_thresholds: z.array(z.object({
     quality_metric: z.string(),
     limit_value: z.number()
   }))
});

/**
 * Pricing calculation schema
 */
export const PricingCalculationSchema = z.object({
  id: z.string().uuid(),
  reception_id: z.string().uuid(),
  base_price_per_kg: z.number().min(0),
  total_weight: z.number().min(0),
  gross_value: z.number().min(0),
  total_discount_amount: z.number().min(0),
  final_total: z.number().min(0),
  calculation_data: PricingCalculationDataSchema,
  created_at: z.string(),
  created_by: z.string().uuid().optional()
});

// ==============================
// Cash Pricing Schemas
// ==============================

/**
 * Create daily price input
 */
export const CreateDailyPriceSchema = z.object({
  fruit_type_id: z.number().int().positive(),
  price_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  price_per_kg: z.number().min(0).max(99999.9999)
});

/**
 * Update daily price input
 */
export const UpdateDailyPriceSchema = z.object({
  id: z.number().int().positive(),
  price_per_kg: z.number().min(0).max(99999.9999).optional(),
  active: z.boolean().optional()
});

/**
 * Delete daily price input
 */
export const DeleteDailyPriceSchema = z.object({
  id: z.number().int().positive()
});

/**
 * Get daily prices input
 */
export const GetDailyPricesSchema = z.object({
  fruit_type_id: z.number().int().positive().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  active_only: z.boolean().optional()
});

// ==============================
// Quality Threshold Schemas
// ==============================

/**
 * Quality metric enum for cash thresholds
 */
export const CashQualityMetricSchema = z.enum(['Humedad', 'Moho', 'Violetas']);

/**
 * Create quality threshold input
 */
export const CreateQualityThresholdSchema = z.object({
  fruit_type_id: z.number().int().positive(),
  metric: CashQualityMetricSchema,
  threshold_percent: z.number().min(0).max(100)
});

/**
 * Update quality threshold input
 */
export const UpdateQualityThresholdSchema = z.object({
  id: z.number().int().positive(),
  threshold_percent: z.number().min(0).max(100).optional(),
  enabled: z.boolean().optional()
});

/**
 * Delete quality threshold input
 */
export const DeleteQualityThresholdSchema = z.object({
  id: z.number().int().positive()
});

/**
 * Get quality thresholds input
 */
export const GetQualityThresholdsSchema = z.object({
  fruit_type_id: z.number().int().positive().optional(),
  enabled_only: z.boolean().optional()
});

// ==============================
// Cash Fruit Types Schemas
// ==============================

/**
 * Create cash fruit type input
 */
export const CreateCashFruitTypeSchema = z.object({
  code: z.string().min(1).max(32).regex(/^[A-Z0-9_]+$/, "El código debe contener solo letras mayúsculas, números y guiones bajos"),
  name: z.string().min(1).max(64).trim()
});

/**
 * Update cash fruit type input
 */
export const UpdateCashFruitTypeSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().min(1).max(32).regex(/^[A-Z0-9_]+$/, "El código debe contener solo letras mayúsculas, números y guiones bajos").optional(),
  name: z.string().min(1).max(64).trim().optional(),
  enabled: z.boolean().optional()
});

/**
 * Delete cash fruit type input
 */
export const DeleteCashFruitTypeSchema = z.object({
  id: z.number().int().positive()
});

/**
 * Get cash fruit types input
 */
export const GetCashFruitTypesSchema = z.object({
  enabled_only: z.boolean().optional()
});

// ==============================
// Cash Customer Schemas
// ==============================

/**
 * Create cash customer input
 */
export const CreateCashCustomerSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  nationalId: z.string().min(1).max(20).trim().regex(/^[0-9\-]+$/, "La cédula debe contener solo números y guiones")
});

/**
 * Update cash customer input
 */
export const UpdateCashCustomerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).trim().optional(),
  nationalId: z.string().min(1).max(20).trim().regex(/^[0-9\-]+$/, "La cédula debe contener solo números y guiones").optional()
});

/**
 * Delete cash customer input
 */
export const DeleteCashCustomerSchema = z.object({
  id: z.number().int().positive()
});

/**
 * Get cash customers input
 */
export const GetCashCustomersSchema = z.object({
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional()
});

// ==============================
// Cash Reception Schemas
// ==============================

/**
 * Create cash reception input
 */
export const CreateCashReceptionSchema = z.object({
  fruit_type_id: z.number().int().positive(),
  customer_id: z.number().int().positive(),
  reception_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  containers_count: z.number().int().min(0),
  total_weight_kg_original: z.number().min(0).max(999999.999),
  calidad_humedad: z.number().min(0).max(100).optional(),
  calidad_moho: z.number().min(0).max(100).optional(),
  calidad_violetas: z.number().min(0).max(100).optional(),
});

/**
 * Update cash reception input
 */
export const UpdateCashReceptionSchema = z.object({
  id: z.number().int().positive(),
  containers_count: z.number().int().min(0).optional(),
  total_weight_kg_original: z.number().min(0).max(999999.999).optional(),
  calidad_humedad: z.number().min(0).max(100).optional(),
  calidad_moho: z.number().min(0).max(100).optional(),
  calidad_violetas: z.number().min(0).max(100).optional(),
});

/**
 * Delete cash reception input
 */
export const DeleteCashReceptionSchema = z.object({
  id: z.number().int().positive()
});

/**
 * Get cash receptions input
 */
export const GetCashReceptionsSchema = z.object({
  fruit_type_id: z.number().int().positive().optional(),
  customer_id: z.number().int().positive().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// ==============================
// Input Schemas
// ==============================

/**
 * Update pricing rule input
 */
export const UpdatePricingRuleSchema = z.object({
  fruit_type: FruitTypeSchema,
  quality_based_pricing_enabled: z.boolean()
});

/**
 * Create discount threshold input
 */
export const CreateDiscountThresholdSchema = z.object({
  pricing_rule_id: z.string().uuid(),
  quality_metric: QualityMetricSchema,
  limit_value: z.number().min(0).max(100) // Quality limit percentage
});

/**
 * Update discount threshold input
 */
export const UpdateDiscountThresholdSchema = z.object({
  id: z.string().uuid(),
  limit_value: z.number().min(0).max(100) // Quality limit percentage
});

/**
 * Quality metric value input
 */
export const QualityMetricValueSchema = z.object({
  metric: QualityMetricSchema,
  value: z.number().min(0).max(100)
});

/**
 * Calculate reception pricing input
 */
export const CalculateReceptionPricingSchema = z.object({
  fruit_type: FruitTypeSchema,
  total_weight: z.number().min(0.01),
  base_price_per_kg: z.number().min(0),
  quality_evaluation: z.array(QualityMetricValueSchema).min(1)
});

/**
 * Save reception with pricing input
 */
export const SaveReceptionWithPricingSchema = z.object({
  farmer_id: z.string().uuid(),
  fruit_type: FruitTypeSchema,
  total_weight: z.number().min(0.01),
  base_price_per_kg: z.number().min(0),
  quality_evaluation: z.array(QualityMetricValueSchema).min(1)
});

// ==============================
// Preview Schema
// ==============================

/**
 * Pricing calculation preview schema
 */
export const PricingCalculationPreviewSchema = z.object({
  base_price_per_kg: z.number(),
  total_weight: z.number(),
  gross_value: z.number(),
  total_discount_amount: z.number(),
  final_total: z.number(),
  discount_breakdown: z.array(z.object({
    quality_metric: z.string(),
    value: z.number(),
    discount_percentage: z.number(),
    discount_amount: z.number()
  })),
  applied_thresholds: z.array(z.object({
    quality_metric: z.string(),
    limit_value: z.number()
  }))
});

// ==============================
// Form Schemas
// ==============================

/**
 * Pricing rule form data
 */
export const PricingRuleFormSchema = z.object({
  fruit_type: FruitTypeSchema,
  quality_based_pricing_enabled: z.boolean()
});

/**
 * Threshold form data
 */
export const ThresholdFormSchema = z.object({
  quality_metric: QualityMetricSchema,
  limit_value: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
    { message: "limit_value must be between 0 and 100" }
  )
});

/**
 * Reception pricing form data
 */
export const ReceptionPricingFormSchema = z.object({
  fruit_type: FruitTypeSchema,
  total_weight: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "total_weight must be a positive number" }
  ),
  base_price_per_kg: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    { message: "base_price_per_kg must be a non-negative number" }
  ),
  quality_evaluation: z.array(z.object({
    metric: QualityMetricSchema,
    value: z.string().refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
      { message: "value must be between 0 and 100" }
    )
  })).min(1, { message: "At least one quality metric is required" })
});

// ==============================
// Array Schemas
// ==============================

/**
 * Array of discount thresholds
 */
export const DiscountThresholdArraySchema = z.array(DiscountThresholdSchema);

/**
 * Array of pricing rules
 */
export const PricingRuleArraySchema = z.array(PricingRuleSchema);

// ==============================
// Type Inference
// ==============================

export type DiscountThreshold = z.infer<typeof DiscountThresholdSchema>;
export type PricingRule = z.infer<typeof PricingRuleSchema>;
export type PricingCalculation = z.infer<typeof PricingCalculationSchema>;
export type PricingCalculationData = z.infer<typeof PricingCalculationDataSchema>;
export type UpdatePricingRule = z.infer<typeof UpdatePricingRuleSchema>;
export type CreateDiscountThreshold = z.infer<typeof CreateDiscountThresholdSchema>;
export type UpdateDiscountThreshold = z.infer<typeof UpdateDiscountThresholdSchema>;
export type QualityMetricValue = z.infer<typeof QualityMetricValueSchema>;
export type CalculateReceptionPricing = z.infer<typeof CalculateReceptionPricingSchema>;
export type SaveReceptionWithPricing = z.infer<typeof SaveReceptionWithPricingSchema>;
export type PricingCalculationPreview = z.infer<typeof PricingCalculationPreviewSchema>;
export type PricingRuleForm = z.infer<typeof PricingRuleFormSchema>;
export type ThresholdForm = z.infer<typeof ThresholdFormSchema>;
export type ReceptionPricingForm = z.infer<typeof ReceptionPricingFormSchema>;

// ==============================
// Cash Customer Types
// ==============================

export type CreateCashCustomer = z.infer<typeof CreateCashCustomerSchema>;
export type UpdateCashCustomer = z.infer<typeof UpdateCashCustomerSchema>;
export type DeleteCashCustomer = z.infer<typeof DeleteCashCustomerSchema>;
export type GetCashCustomers = z.infer<typeof GetCashCustomersSchema>;

// ==============================
// Utility Functions
// ==============================

/**
 * Parse and validate threshold form data
 */
export function parseThresholdFormData(formData: ThresholdForm): Omit<CreateDiscountThreshold, 'pricing_rule_id'> {
  return {
    quality_metric: formData.quality_metric,
    limit_value: Number(formData.limit_value)
  };
}

/**
 * Parse and validate reception pricing form data
 */
export function parseReceptionPricingFormData(formData: ReceptionPricingForm): CalculateReceptionPricing {
  return {
    fruit_type: formData.fruit_type,
    total_weight: Number(formData.total_weight),
    base_price_per_kg: Number(formData.base_price_per_kg),
    quality_evaluation: formData.quality_evaluation.map(q => ({
      metric: q.metric,
      value: Number(q.value)
    }))
  };
}

/**
 * Validate and throw error if invalid
 */
export function validatePricingRule(data: unknown): PricingRule {
  const result = PricingRuleSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid pricing rule: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Validate and throw error if invalid
 */
export function validateDiscountThreshold(data: unknown): DiscountThreshold {
  const result = DiscountThresholdSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid discount threshold: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Validate and throw error if invalid
 */
export function validatePricingCalculation(data: unknown): PricingCalculation {
  const result = PricingCalculationSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid pricing calculation: ${result.error.message}`);
  }
  return result.data;
}

// ==============================
// WEIGHT DISCOUNT SYSTEM SCHEMAS
// ==============================

/**
 * Quality evaluation data schema for weight discounts
 */
export const QualityEvaluationDataSchema = z.object({
  moho: z.number().min(0).max(100, "Moho debe estar entre 0 y 100"),
  humedad: z.number().min(0).max(100, "Humedad debe estar entre 0 y 100"),
  violetas: z.number().min(0).max(100, "Violetas debe estar entre 0 y 100"),
});

/**
 * Weight discount request schema
 */
export const WeightDiscountRequestSchema = z.object({
  reception_id: z.string().uuid("ID de recepción inválido"),
  total_weight: z.number().positive("El peso total debe ser positivo"),
  quality_data: QualityEvaluationDataSchema,
  fruit_type_id: z.string().uuid("ID de tipo de fruta inválido"),
});

/**
 * Discount breakdown item schema
 */
export const DiscountBreakdownItemSchema = z.object({
  parametro: z.enum(['Moho', 'Humedad', 'Violetas']),
  umbral: z.number().min(0, "El umbral debe ser positivo"),
  valor: z.number().min(0).max(100, "El valor debe estar entre 0 y 100"),
  porcentaje_descuento: z.number().min(0).max(100, "El descuento debe estar entre 0 y 100"),
  peso_descuento: z.number().min(0, "El peso de descuento debe ser positivo"),
});

/**
 * Weight discount calculation schema
 */
export const WeightDiscountCalculationSchema = z.object({
  reception_id: z.string().uuid(),
  total_peso_original: z.number().min(0, "El peso original no puede ser negativo"),
  total_peso_descuento: z.number().min(0, "El descuento no puede ser negativo"),
  total_peso_final: z.number().min(0, "El peso final no puede ser negativo"),
  breakdown: z.array(DiscountBreakdownItemSchema),
  calculation_timestamp: z.string(),
  calculated_by: z.string(),
}).refine(
  (data) => Math.abs(data.total_peso_final - (data.total_peso_original - data.total_peso_descuento)) < 0.01,
  {
    message: "La suma de peso original y descuento debe igualar el peso final",
    path: ["total_peso_final"]
  }
);

/**
 * Admin discount override request schema
 */
export const AdminDiscountOverrideRequestSchema = z.object({
  reception_id: z.string().uuid("ID de recepción inválido"),
  total_peso_original: z.number().min(0, "El peso original debe ser positivo"),
  total_peso_descuento: z.number().min(0, "El descuento no puede ser negativo"),
  total_peso_final: z.number().min(0, "El peso final debe ser positivo"),
  override_reason: z.string().min(1, "Se requiere una razón para la anulación"),
  breakdown: z.array(DiscountBreakdownItemSchema).optional(),
}).refine(
  (data) => Math.abs(data.total_peso_final - (data.total_peso_original - data.total_peso_descuento)) < 0.01,
  {
    message: "La suma de peso original y descuento debe igualar el peso final",
    path: ["total_peso_final"]
  }
);

/**
 * Weight discount result schema
 */
export const WeightDiscountResultSchema = z.object({
  original_weight: z.number().min(0),
  total_discount: z.number().min(0),
  final_weight: z.number().min(0),
  breakdowns: z.array(DiscountBreakdownItemSchema),
});

/**
 * Discount breakdown database record schema
 */
export const DiscountBreakdownSchema = z.object({
  id: z.string().uuid().optional(),
  recepcion_id: z.string().uuid(),
  parametro: z.string(),
  umbral: z.number().min(0),
  valor: z.number().min(0).max(100),
  porcentaje_descuento: z.number().min(0).max(100),
  peso_descuento: z.number().min(0),
  created_at: z.string().datetime().optional(),
  created_by: z.string().uuid().optional()
});

// ==============================
// Form Schemas for Weight Discounts
// ==============================

/**
 * Weight discount form data schema
 */
export const WeightDiscountFormSchema = z.object({
  total_peso_original: z.number().min(0, "El peso original debe ser positivo"),
  total_peso_descuento: z.number().min(0, "El descuento no puede ser negativo"),
  total_peso_final: z.number().min(0, "El peso final debe ser positivo"),
}).refine(
  (data) => Math.abs(data.total_peso_final - (data.total_peso_original - data.total_peso_descuento)) < 0.01,
  {
    message: "La suma de peso original y descuento debe igualar el peso final",
    path: ["total_peso_final"]
  }
);

/**
 * Quality evaluation form schema
 */
export const QualityEvaluationFormSchema = z.object({
  moho: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
    { message: "Moho debe estar entre 0 y 100" }
  ),
  humedad: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
    { message: "Humedad debe estar entre 0 y 100" }
  ),
  violetas: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
    { message: "Violetas debe estar entre 0 y 100" }
  )
});

// ==============================
// Type Inference for Weight Discounts
// ==============================

export type WeightDiscountRequest = z.infer<typeof WeightDiscountRequestSchema>;
export type WeightDiscountResponse = {
  success: boolean;
  data?: WeightDiscountCalculation;
  error?: string;
};
export type DiscountBreakdownItem = z.infer<typeof DiscountBreakdownItemSchema>;
export type WeightDiscountCalculation = z.infer<typeof WeightDiscountCalculationSchema>;
export type AdminDiscountOverrideRequest = z.infer<typeof AdminDiscountOverrideRequestSchema>;
export type WeightDiscountResult = z.infer<typeof WeightDiscountResultSchema>;
export type DiscountBreakdown = z.infer<typeof DiscountBreakdownSchema>;
export type QualityEvaluationData = z.infer<typeof QualityEvaluationDataSchema>;
export type WeightDiscountForm = z.infer<typeof WeightDiscountFormSchema>;
export type QualityEvaluationForm = z.infer<typeof QualityEvaluationFormSchema>;

// ==============================
// Utility Functions for Weight Discounts
// ==============================

/**
 * Parse quality evaluation form data
 */
export function parseQualityEvaluationForm(formData: QualityEvaluationForm): QualityEvaluationData {
  return {
    moho: Number(formData.moho),
    humedad: Number(formData.humedad),
    violetas: Number(formData.violetas)
  };
}

/**
 * Validate and throw error if invalid
 */
export function validateWeightDiscountRequest(data: unknown): WeightDiscountRequest {
  const result = WeightDiscountRequestSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid weight discount request: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Validate and throw error if invalid
 */
export function validateWeightDiscountCalculation(data: unknown): WeightDiscountCalculation {
  const result = WeightDiscountCalculationSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid weight discount calculation: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Validate and throw error if invalid
 */
export function validateAdminDiscountOverrideRequest(data: unknown): AdminDiscountOverrideRequest {
  const result = AdminDiscountOverrideRequestSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid admin override request: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Validate and throw error if invalid
 */
export function validateQualityEvaluationData(data: unknown): QualityEvaluationData {
  const result = QualityEvaluationDataSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid quality evaluation data: ${result.error.message}`);
  }
  return result.data;
}
