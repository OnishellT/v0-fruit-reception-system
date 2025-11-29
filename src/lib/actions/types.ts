/**
 * Type definitions for migrated features from Next.js
 * Updated with complete pricing system types
 */

import type { InferSelectModel } from 'drizzle-orm';
import type {
    receptions,
    providers,
    drivers,
    fruitTypes,
    users,
    pricingCalculations,
    qualityEvaluations,
    laboratorySamples,
    cacaoBatches,
    asociaciones,
    certifications,
    providerCertifications,
    pricingRules,
    discountThresholds
} from '~/lib/db/schema';

// Entity types
export type Reception = InferSelectModel<typeof receptions>;
export type Provider = InferSelectModel<typeof providers>;
export type Driver = InferSelectModel<typeof drivers>;
export type FruitType = InferSelectModel<typeof fruitTypes>;
export type User = InferSelectModel<typeof users>;
export type PricingCalculationDB = InferSelectModel<typeof pricingCalculations>;
export type QualityEvaluation = InferSelectModel<typeof qualityEvaluations>;
export type LaboratorySample = InferSelectModel<typeof laboratorySamples>;
export type CacaoBatch = InferSelectModel<typeof cacaoBatches>;
export type Asociacion = InferSelectModel<typeof asociaciones>;
export type Certification = InferSelectModel<typeof certifications>;
export type ProviderCertification = InferSelectModel<typeof providerCertifications>;

// ==============================
// PRICING SYSTEM TYPES
// ==============================

/**
 * Pricing rule configuration for a fruit type
 */
export interface PricingRule {
    id: string;
    fruit_type: 'CAFÉ' | 'CACAO' | 'MIEL' | 'COCOS';
    quality_based_pricing_enabled: boolean;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

/**
 * Discount threshold for a quality metric
 */
export interface DiscountThreshold {
    id: string;
    pricing_rule_id: string;
    quality_metric: 'Violetas' | 'Humedad' | 'Moho';
    limit_value: number; // Quality limit percentage - anything above this gets discounted
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

/**
 * Quality metric value from evaluation
 */
export interface QualityMetricValue {
    metric: 'Violetas' | 'Humedad' | 'Moho';
    value: number;
}

/**
 * Quality evaluation data for weight discount calculations
 */
export interface QualityEvaluationData {
    moho: number;
    humedad: number;
    violetas: number;
}

/**
 * Individual discount breakdown item
 */
export interface DiscountBreakdownItem {
    parametro: 'Moho' | 'Humedad' | 'Violetas';
    umbral: number;
    valor: number;
    porcentaje_descuento: number;
    peso_descuento: number;
}

/**
 * Weight discount calculation result
 */
export interface WeightDiscountResult {
    original_weight: number;
    total_discount: number;
    final_weight: number;
    breakdowns: DiscountBreakdownItem[];
}

/**
 * Pricing calculation preview (before saving)
 */
export interface PricingCalculationPreview {
    base_price_per_kg: number;
    total_weight: number;
    gross_value: number;
    total_discount_amount: number;
    final_total: number;
    discount_breakdown: Array<{
        quality_metric: string;
        value: number;
        discount_percentage: number;
        discount_amount: number;
    }>;
    applied_thresholds: Array<{
        quality_metric: string;
        limit_value: number;
    }>;
}

/**
 * Detailed breakdown of pricing calculation (stored in JSONB)
 */
export interface PricingCalculationData {
    quality_metrics: Array<{
        metric: string;
        value: number;
        discount_percentage: number;
        discount_amount: number;
    }>;
    total_discounts: number;
    timestamp: string;
    fruit_type: string;
    applied_thresholds: Array<{
        quality_metric: string;
        limit_value: number;
    }>;
}

/**
 * Immutable pricing calculation for a reception
 */
export interface PricingCalculation {
    id: string;
    reception_id: string;
    base_price_per_kg: number;
    total_weight: number;
    gross_value: number;
    total_discount_amount: number;
    final_total: number;
    calculation_data: PricingCalculationData;
    created_at: string;
    created_by?: string;
}

// ==============================
// INPUT TYPES
// ==============================

/**
 * Input for updating pricing rule enable/disable
 */
export interface UpdatePricingRuleData {
    fruit_type: 'CAFÉ' | 'CACAO' | 'MIEL' | 'COCOS';
    quality_based_pricing_enabled: boolean;
}

/**
 * Input for creating a discount threshold
 */
export interface CreateDiscountThresholdData {
    pricing_rule_id: string;
    quality_metric: 'Violetas' | 'Humedad' | 'Moho';
    limit_value: number;
}

/**
 * Input for updating a discount threshold
 */
export interface UpdateDiscountThresholdData {
    id: string;
    limit_value: number;
}

/**
 * Input for calculating reception pricing
 */
export interface CalculateReceptionPricingData {
    fruit_type: 'CAFÉ' | 'CACAO' | 'MIEL' | 'COCOS';
    total_weight: number;
    base_price_per_kg: number;
    quality_evaluation: QualityMetricValue[];
    reception_id?: string;
}

/**
 * Input for saving reception with pricing calculation
 */
export interface SaveReceptionWithPricingData {
    farmer_id: string;
    fruit_type: 'CAFÉ' | 'CACAO' | 'MIEL' | 'COCOS';
    total_weight: number;
    base_price_per_kg: number;
    quality_evaluation: QualityMetricValue[];
}

/**
 * Weight discount calculation request
 */
export interface WeightDiscountRequest {
    reception_id: string;
    total_weight: number;
    quality_data: QualityEvaluationData;
    fruit_type_id: string;
}

/**
 * Admin discount override request
 */
export interface AdminDiscountOverrideRequest {
    reception_id: string;
    total_peso_original: number;
    total_peso_descuento: number;
    total_peso_final: number;
    override_reason: string;
    breakdown?: DiscountBreakdownItem[];
}

// ==============================
// RESPONSE TYPES
// ==============================

/**
 * Server action response for pricing rules
 */
export interface PricingRuleResponse {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Server action response for discount thresholds
 */
export interface DiscountThresholdResponse {
    success: boolean;
    data?: DiscountThreshold;
    error?: string;
}

/**
 * Server action response for pricing calculation preview
 */
export interface PricingCalculationPreviewResponse {
    can_calculate: boolean;
    data?: PricingCalculationPreview;
    errors?: string[];
}

/**
 * Weight discount calculation response
 */
export interface WeightDiscountResponse {
    success: boolean;
    data?: WeightDiscountCalculation;
    error?: string;
    details?: string[];
}

/**
 * Weight discount calculation result (for DB)
 */
export interface WeightDiscountCalculation {
    reception_id: string;
    total_peso_original: number;
    total_peso_descuento: number;
    total_peso_final: number;
    breakdown: DiscountBreakdownItem[];
    calculation_timestamp: string;
    calculated_by: string;
}

// ==============================
// COMBINED TYPES
// ==============================

/**
 * Pricing rule with all its thresholds
 */
export interface PricingRuleWithThresholds extends PricingRule {
    discount_thresholds: DiscountThreshold[];
}

// Reception with relations
export interface ReceptionWithDetails extends Reception {
    provider?: Provider;
    driver?: Driver;
    fruitType?: FruitType;
    pricingCalculation?: PricingCalculation;
    qualityEvaluation?: QualityEvaluation;
    laboratorySample?: LaboratorySample;
    batch?: CacaoBatch;
}

// Form data types
export interface CreateReceptionFormData {
    providerId: string;
    driverId: string;
    fruitTypeId: string;
    truckPlate: string;
    totalContainers: number;
    receptionDate: string;
    receptionTime: string;
    notes?: string;
    quality?: QualityMetrics;
}

export interface CreatePricingFormData {
    fruitTypeId: string;
    priceDate: string;
    pricePerKg: number;
}

// Quality evaluation types (for non-pricing features)
export interface QualityMetrics {
    violetas?: number;
    humedad?: number;
    moho?: number;
    basura?: number;
}

export interface QualityDiscountResult {
    metric: string;
    threshold: number;
    value: number;
    discountPercentage: number;
    discountWeight: number;
}

// Dashboard metrics types
export interface DashboardMetrics {
    today: PeriodMetrics;
    weekly: PeriodMetrics;
    monthly: PeriodMetrics;
    topFruitTypes: FruitTypeMetric[];
    recentActivity: ActivityItem[];
}

export interface PeriodMetrics {
    regularReceptions: number;
    cashReceptions: number;
    totalReceptions: number;
    regularWeight: number;
    cashWeight: number;
    totalWeight: number;
    regularRevenue: number;
    cashRevenue: number;
    totalRevenue: number;
}

export interface FruitTypeMetric {
    name: string;
    regularWeight: number;
    cashWeight: number;
    totalWeight: number;
}

export interface ActivityItem {
    id: string;
    type: 'regular' | 'cash';
    fruitType: string;
    customer: string;
    weight: number;
    revenue: number;
    createdAt: string;
}

// ==============================
// TYPE ALIASES & CONSTANTS
// ==============================

export type FruitTypeEnum = 'CAFÉ' | 'CACAO' | 'MIEL' | 'COCOS';
export type QualityMetric = 'Violetas' | 'Humedad' | 'Moho';

export const FRUIT_TYPES = ['CAFÉ', 'CACAO', 'MIEL', 'COCOS'] as const;
export const QUALITY_METRICS = ['Violetas', 'Humedad', 'Moho'] as const;
