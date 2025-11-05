import { z } from "zod";

// TypeScript types for Quality-Based Pricing System
// File: lib/types/pricing.ts
// Date: 2025-10-31

// ==============================
// Zod Schemas
// ==============================

/**
 * Zod schema for WeightDiscountRequest
 */
export const WeightDiscountRequestSchema = z.object({
  reception_id: z.string().uuid(),
  total_weight: z.number().positive(),
  quality_data: z.object({
    moho: z.number().min(0).max(100),
    humedad: z.number().min(0).max(100),
    violetas: z.number().min(0).max(100),
  }),
  fruit_type_id: z.string().uuid(),
});

// ==============================
// Core Types
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
 * Now uses a single limit value - anything above this limit gets discounted proportionally
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

// ==============================
// Input Types
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
  limit_value: number; // Quality limit percentage
}

/**
 * Input for updating a discount threshold
 */
export interface UpdateDiscountThresholdData {
  id: string;
  limit_value: number; // Quality limit percentage
}

/**
 * Quality metric value from evaluation
 */
export interface QualityMetricValue {
  metric: 'Violetas' | 'Humedad' | 'Moho';
  value: number;
}

/**
 * Input for calculating reception pricing
 */
export interface CalculateReceptionPricingData {
  fruit_type: 'CAFÉ' | 'CACAO' | 'MIEL' | 'COCOS';
  total_weight: number;
  base_price_per_kg: number;
  quality_evaluation: QualityMetricValue[];
  reception_id?: string; // Optional for backward compatibility
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

// ==============================
// Response Types
// ==============================

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
 * Server action response for pricing rules
 */
export interface PricingRuleResponse {
  success: boolean;
  data?: PricingRule;
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
 * Server action response for pricing calculations
 */
export interface PricingCalculationResponse {
  success: boolean;
  data?: PricingCalculation;
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

// ==============================
// Combined Types
// ==============================

/**
 * Pricing rule with all its thresholds
 */
export interface PricingRuleWithThresholds extends PricingRule {
  discount_thresholds: DiscountThreshold[];
}

/**
 * Reception with pricing calculation
 */
export interface ReceptionWithPricing {
  id: string;
  reception_number: string;
  provider_id: string;
  driver_id: string;
  total_weight: number;
  pricing_calculation_id?: string;
  pricing_calculation?: PricingCalculation;
}

/**
 * Historical pricing breakdown with comparison
 */
export interface HistoricalPricingBreakdown {
  reception: {
    id: string;
    date: string;
    fruit_type: string;
    total_weight: number;
  };
  pricing_calculation: PricingCalculation;
  current_pricing_rules?: {
    thresholds: Array<{
      quality_metric: string;
      limit_value: number;
    }>;
    enabled: boolean;
  };
  comparison?: {
    would_change: boolean;
    new_total?: number;
    difference?: number;
  };
}

/**
 * Form data types for UI components
 */
export interface PricingRuleFormData {
  fruit_type: 'CAFÉ' | 'CACAO' | 'MIEL' | 'COCOS';
  quality_based_pricing_enabled: boolean;
}

export interface ThresholdFormData {
  quality_metric: 'Violetas' | 'Humedad' | 'Moho';
  limit_value: string; // Quality limit percentage as string for form input
}

export interface ReceptionPricingFormData {
  fruit_type: 'CAFÉ' | 'CACAO' | 'MIEL' | 'COCOS';
  total_weight: string;
  base_price_per_kg: string;
  quality_evaluation: Array<{
    metric: 'Violetas' | 'Humedad' | 'Moho';
    value: string;
  }>;
}

// ==============================
// Type Aliases
// ==============================

export type FruitType = 'CAFÉ' | 'CACAO' | 'MIEL' | 'COCOS';
export type QualityMetric = 'Violetas' | 'Humedad' | 'Moho';

// ==============================
// Constants
// ==============================

export const FRUIT_TYPES = ['CAFÉ', 'CACAO', 'MIEL', 'COCOS'] as const;
export const QUALITY_METRICS = ['Violetas', 'Humedad', 'Moho'] as const;

export const MIN_DISCOUNT_PERCENTAGE = 0;
export const MAX_DISCOUNT_PERCENTAGE = 100;

// Default threshold examples (can be used for initial setup)
// Now using limit values - anything above the limit gets discounted proportionally
export const DEFAULT_THRESHOLDS = {
  Violetas: [
    { limit_value: 5 },   // 5% limit - anything above gets discounted
    { limit_value: 10 },  // 10% limit
    { limit_value: 15 }   // 15% limit
  ],
  Humedad: [
    { limit_value: 10 },  // 10% limit
    { limit_value: 15 },  // 15% limit
    { limit_value: 20 }   // 20% limit
  ],
  Moho: [
    { limit_value: 5 },   // 5% limit
    { limit_value: 10 },  // 10% limit
    { limit_value: 15 }   // 15% limit
  ]
} as const;

// ==============================
// Type Guards
// ==============================

export function isPricingRule(obj: unknown): obj is PricingRule {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'fruit_type' in obj &&
    'quality_based_pricing_enabled' in obj
  );
}

export function isDiscountThreshold(obj: unknown): obj is DiscountThreshold {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'quality_metric' in obj &&
    'min_value' in obj &&
    'max_value' in obj &&
    'discount_percentage' in obj
  );
}

export function isPricingCalculation(obj: unknown): obj is PricingCalculation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'reception_id' in obj &&
    'base_price_per_kg' in obj &&
    'final_total' in obj
  );
}

// ==============================
// WEIGHT DISCOUNT SYSTEM TYPES
// ==============================

/**
 * Quality evaluation data for weight discount calculations
 */
export interface QualityEvaluationData {
  moho: number;
  humedad: number;
  violetas: number;
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
 * Weight discount calculation response
 */
export interface WeightDiscountResponse {
  success: boolean;
  data?: WeightDiscountCalculation;
  error?: string;
  details?: string[];
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
export interface WeightDiscountCalculation {
  reception_id: string;
  total_peso_original: number;
  total_peso_descuento: number;
  total_peso_final: number;
  breakdown: DiscountBreakdownItem[];
  calculation_timestamp: string;
  calculated_by: string;
}

/**
 * Weight discount result from calculation utility
 */
export interface WeightDiscountResult {
  original_weight: number;
  total_discount: number;
  final_weight: number;
  breakdowns: DiscountBreakdownItem[];
}

/**
 * Discount breakdown record from database
 */
export interface DiscountBreakdown {
  id: string;
  recepcion_id: string;
  parametro: string;               // "Moho", "Humedad", "Violetas"
  umbral: number;                  // Threshold value
  valor: number;                   // Actual quality value
  porcentaje_descuento: number;   // Discount percentage
  peso_descuento: number;          // Weight reduction amount

  created_by: string;
  created_at: string;
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

/**
 * Admin discount override response
 */
export interface AdminDiscountOverrideResponse {
  success: boolean;
  data?: {
    reception_id: string;
    original_calculation: WeightDiscountCalculation;
    override_calculation: WeightDiscountCalculation;
    override_timestamp: string;
    overridden_by: string;
  };
  error?: string;
}

/**
 * Server action types for weight discount system
 */
export interface CalculateWeightDiscountsAction {
  (request: WeightDiscountRequest): Promise<WeightDiscountResponse>;
}

export interface OverrideWeightDiscountsAction {
  (request: AdminDiscountOverrideRequest, userId: string): Promise<WeightDiscountResponse>;
}

export interface GetDiscountBreakdownAction {
  (receptionId: string): Promise<{
    success: boolean;
    data?: DiscountBreakdownItem[];
    error?: string;
  }>;
}

/**
 * UI component props for discount breakdown
 */
export interface DiscountBreakdownProps {
  receptionId: string;
  isEditable?: boolean;
  onDiscountChange?: (calculation: WeightDiscountCalculation) => void;
  onOverrideSubmit?: (override: AdminDiscountOverrideRequest) => void;
}

/**
 * UI component props for pricing preview
 */
export interface PricingPreviewProps {
  totalWeight: number;
  qualityData: QualityEvaluationData;
  fruitTypeId: string;
  receptionId?: string;
  onCalculationComplete?: (calculation: WeightDiscountCalculation) => void;
}

/**
 * Error types for weight discount system
 */
export class DiscountCalculationError extends Error {
  constructor(
    message: string,
    public code: DiscountErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'DiscountCalculationError';
  }
}

export const DiscountErrorCodes = {
  INVALID_QUALITY_DATA: 'INVALID_QUALITY_DATA',
  THRESHOLD_NOT_FOUND: 'THRESHOLD_NOT_FOUND',
  CALCULATION_FAILED: 'CALCULATION_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RECEPTION_NOT_FOUND: 'RECEPTION_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  ADMIN_OVERRIDE_REQUIRED: 'ADMIN_OVERRIDE_REQUIRED'
} as const;

export type DiscountErrorCode = typeof DiscountErrorCodes[keyof typeof DiscountErrorCodes];

/**
 * Extended reception interface with weight discount fields
 */
export interface ReceptionWithWeightDiscounts {
  id: string;
  reception_number: string;
  provider_id: string;
  driver_id: string;
  fruit_type_id: string;
  truck_plate: string;
  total_containers: number;

  // Weight discount fields (NEW)
  total_peso_original: number;     // Before discounts
  total_peso_descuento: number;    // Total discount amount
  total_peso_final: number;        // After discounts

  // Existing fields
  reception_date: string;
  reception_time: string;
  status: 'draft' | 'completed' | 'cancelled';
  notes: string;

  // Relationships
  pricing_calculation_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Form state extension for weight discounts
 */
export interface ReceptionFormState {
  // Existing fields
  provider_id: string;
  driver_id: string;
  fruit_type_id: string;
  truck_plate: string;
  total_containers: number;
  notes: string;

  // Weight discount fields (NEW)
  total_peso_original: number;
  total_peso_descuento: number;
  total_peso_final: number;
}

/**
 * Discount calculation state management
 */
export interface DiscountCalculationState {
  calculation: WeightDiscountCalculation | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}
