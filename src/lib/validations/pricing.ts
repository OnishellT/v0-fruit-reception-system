/**
 * Zod validation schemas for pricing system
 * Migrated from Next.js to Qwik City
 * Compatible with Qwik's zod$() helper
 */

import { z } from 'zod';

// ==============================
// FRUIT TYPES & QUALITY METRICS
// ==============================

export const FruitTypeSchema = z.enum(['CAFÉ', 'CACAO', 'MIEL', 'COCOS']);
export const QualityMetricSchema = z.enum(['Violetas', 'Humedad', 'Moho']);

// ==============================
// PRICING RULES SCHEMAS
// ==============================

/**
 * Schema for updating pricing rules (enable/disable quality-based pricing)
 */
export const UpdatePricingRuleSchema = z.object({
    fruit_type: FruitTypeSchema,
    quality_based_pricing_enabled: z.boolean(),
});

// ==============================
// DISCOUNT THRESHOLDS SCHEMAS
// ==============================

/**
 * Schema for creating a new discount threshold
 */
export const CreateDiscountThresholdSchema = z.object({
    pricing_rule_id: z.string().uuid(),
    quality_metric: QualityMetricSchema,
    limit_value: z.number().min(0).max(100),
});

/**
 * Schema for updating a discount threshold
 */
export const UpdateDiscountThresholdSchema = z.object({
    id: z.string().uuid(),
    limit_value: z.number().min(0).max(100),
});

/**
 * Schema for deleting a discount threshold
 */
export const DeleteDiscountThresholdSchema = z.object({
    id: z.string().uuid(),
});

// ==============================
// PRICING CALCULATION SCHEMAS
// ==============================

/**
 * Schema for quality metric value
 */
export const QualityMetricValueSchema = z.object({
    metric: QualityMetricSchema,
    value: z.number().min(0).max(100),
});

/**
 * Schema for calculating reception pricing (preview)
 */
export const CalculateReceptionPricingSchema = z.object({
    fruit_type: FruitTypeSchema,
    total_weight: z.number().positive(),
    base_price_per_kg: z.number().positive(),
    quality_evaluation: z.array(QualityMetricValueSchema).min(1),
    reception_id: z.string().uuid().optional(),
});

/**
 * Schema for saving reception with pricing
 */
export const SaveReceptionWithPricingSchema = z.object({
    farmer_id: z.string().uuid(),
    fruit_type: FruitTypeSchema,
    total_weight: z.number().positive(),
    base_price_per_kg: z.number().positive(),
    quality_evaluation: z.array(QualityMetricValueSchema).min(1),
});

// ==============================
// WEIGHT DISCOUNT SCHEMAS
// ==============================

/**
 * Schema for quality evaluation data
 */
export const QualityEvaluationDataSchema = z.object({
    moho: z.number().min(0).max(100),
    humedad: z.number().min(0).max(100),
    violetas: z.number().min(0).max(100),
});

/**
 * Schema for weight discount request
 */
export const WeightDiscountRequestSchema = z.object({
    reception_id: z.string().uuid(),
    total_weight: z.number().positive(),
    quality_data: QualityEvaluationDataSchema,
    fruit_type_id: z.string().uuid(),
});

/**
 * Schema for admin discount override
 */
export const AdminDiscountOverrideRequestSchema = z.object({
    reception_id: z.string().uuid(),
    total_peso_original: z.number().positive(),
    total_peso_descuento: z.number().min(0),
    total_peso_final: z.number().positive(),
    override_reason: z.string().min(10).max(500),
    breakdown: z.array(z.object({
        parametro: z.enum(['Moho', 'Humedad', 'Violetas']),
        umbral: z.number().min(0).max(100),
        valor: z.number().min(0).max(100),
        porcentaje_descuento: z.number().min(0).max(100),
        peso_descuento: z.number().min(0),
    })).optional(),
});

// ==============================
// DAILY PRICES SCHEMAS
// ==============================

/**
 * Schema for creating a daily price
 */
export const CreateDailyPriceSchema = z.object({
    fruit_type_id: z.string().uuid(),
    price_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    price_per_kg: z.number().positive(),
});

/**
 * Schema for updating a daily price
 */
export const UpdateDailyPriceSchema = z.object({
    id: z.string().uuid(),
    price_per_kg: z.number().positive(),
});

/**
 * Schema for getting daily price
 */
export const GetDailyPriceSchema = z.object({
    fruit_type_id: z.string().uuid(),
    price_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

/**
 * Schema for deactivating a daily price
 */
export const DeactivateDailyPriceSchema = z.object({
    id: z.string().uuid(),
});

// ==============================
// FORM DATA SCHEMAS (for UI)
// ==============================

/**
 * Schema for pricing rule form data
 */
export const PricingRuleFormSchema = z.object({
    fruit_type: FruitTypeSchema,
    quality_based_pricing_enabled: z.boolean(),
});

/**
 * Schema for threshold form data
 */
export const ThresholdFormSchema = z.object({
    quality_metric: QualityMetricSchema,
    limit_value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), 'Must be a valid number')
        .transform((val) => parseFloat(val))
        .refine((val) => val >= 0 && val <= 100, 'Must be between 0 and 100'),
});

/**
 * Schema for reception pricing form data
 */
export const ReceptionPricingFormSchema = z.object({
    fruit_type: FruitTypeSchema,
    total_weight: z.string()
        .refine((val) => !isNaN(parseFloat(val)), 'Must be a valid number')
        .transform((val) => parseFloat(val))
        .refine((val) => val > 0, 'Must be positive'),
    base_price_per_kg: z.string()
        .refine((val) => !isNaN(parseFloat(val)), 'Must be a valid number')
        .transform((val) => parseFloat(val))
        .refine((val) => val > 0, 'Must be positive'),
    quality_evaluation: z.array(z.object({
        metric: QualityMetricSchema,
        value: z.string()
            .refine((val) => !isNaN(parseFloat(val)), 'Must be a valid number')
            .transform((val) => parseFloat(val))
            .refine((val) => val >= 0 && val <= 100, 'Must be between 0 and 100'),
    })),
});

// ==============================
// QUERY PARAMETER SCHEMAS
// ==============================

/**
 * Schema for pricing rules query params
 */
export const PricingRulesQuerySchema = z.object({
    fruit_type_id: z.string().uuid(),
});

/**
 * Schema for discount thresholds query params
 */
export const DiscountThresholdsQuerySchema = z.object({
    fruit_type: FruitTypeSchema,
});

/**
 * Schema for discount breakdown query params
 */
export const DiscountBreakdownQuerySchema = z.object({
    reception_id: z.string().uuid(),
});

// ==============================
// VALIDATION HELPERS
// ==============================

/**
 * Validation error formatter for Qwik actions
 */
export function formatValidationErrors(errors: z.ZodError) {
    return errors.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
    }));
}

/**
 * Safe parse wrapper with formatted errors
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown) {
    const result = schema.safeParse(data);
    if (!result.success) {
        return {
            success: false as const,
            errors: formatValidationErrors(result.error),
        };
    }
    return {
        success: true as const,
        data: result.data,
    };
}
