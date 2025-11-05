// API Schema for Weight Discount Calculation and Visualization
// TypeScript interfaces and Zod schemas for type safety

import { z } from 'zod';

// ============================================
// Request/Response Types
// ============================================

export interface WeightDiscountRequest {
  reception_id: string;
  total_weight: number;
  quality_data: QualityEvaluationData;
  fruit_type_id: string;
}

export interface WeightDiscountResponse {
  success: boolean;
  data?: WeightDiscountCalculation;
  error?: string;
}

export interface DiscountBreakdownItem {
  parametro: 'Moho' | 'Humedad' | 'Violetas';
  umbral: number;
  valor: number;
  porcentaje_descuento: number;
  peso_descuento: number;
}

export interface WeightDiscountCalculation {
  reception_id: string;
  total_peso_original: number;
  total_peso_descuento: number;
  total_peso_final: number;
  breakdown: DiscountBreakdownItem[];
  calculation_timestamp: string;
  calculated_by: string;
}

export interface QualityEvaluationData {
  moho: number;
  humedad: number;
  violetas: number;
}

export interface AdminDiscountOverrideRequest {
  reception_id: string;
  total_peso_original: number;
  total_peso_descuento: number;
  total_peso_final: number;
  override_reason: string;
  breakdown?: DiscountBreakdownItem[];
}

// ============================================
// Zod Validation Schemas
// ============================================

export const QualityEvaluationSchema = z.object({
  moho: z.number().min(0).max(100, "Moho debe estar entre 0 y 100"),
  humedad: z.number().min(0).max(100, "Humedad debe estar entre 0 y 100"),
  violetas: z.number().min(0).max(100, "Violetas debe estar entre 0 y 100"),
});

export const DiscountBreakdownSchema = z.object({
  parametro: z.enum(['Moho', 'Humedad', 'Violetas']),
  umbral: z.number().min(0, "El umbral debe ser positivo"),
  valor: z.number().min(0).max(100, "El valor debe estar entre 0 y 100"),
  porcentaje_descuento: z.number().min(0).max(100, "El descuento debe estar entre 0 y 100"),
  peso_descuento: z.number().min(0, "El peso de descuento debe ser positivo"),
});

export const WeightDiscountRequestSchema = z.object({
  reception_id: z.string().uuid("ID de recepción inválido"),
  total_weight: z.number().positive("El peso total debe ser positivo"),
  quality_data: QualityEvaluationSchema,
  fruit_type_id: z.string().uuid("ID de tipo de fruta inválido"),
});

export const WeightDiscountCalculationSchema = z.object({
  reception_id: z.string().uuid(),
  total_peso_original: z.number().min(0, "El peso original no puede ser negativo"),
  total_peso_descuento: z.number().min(0, "El descuento no puede ser negativo"),
  total_peso_final: z.number().min(0, "El peso final no puede ser negativo"),
  breakdown: z.array(DiscountBreakdownSchema),
  calculation_timestamp: z.string(),
  calculated_by: z.string(),
}).refine(
  (data) => Math.abs(data.total_peso_final - (data.total_peso_original - data.total_peso_descuento)) < 0.01,
  {
    message: "La suma de peso original y descuento debe igualar el peso final",
    path: ["total_peso_final"]
  }
);

export const AdminDiscountOverrideRequestSchema = z.object({
  reception_id: z.string().uuid("ID de recepción inválido"),
  total_peso_original: z.number().min(0, "El peso original debe ser positivo"),
  total_peso_descuento: z.number().min(0, "El descuento no puede ser negativo"),
  total_peso_final: z.number().min(0, "El peso final debe ser positivo"),
  override_reason: z.string().min(1, "Se requiere una razón para la anulación"),
  breakdown: z.array(DiscountBreakdownSchema).optional(),
}).refine(
  (data) => Math.abs(data.total_peso_final - (data.total_peso_original - data.total_peso_descuento)) < 0.01,
  {
    message: "La suma de peso original y descuento debe igualar el peso final",
    path: ["total_peso_final"]
  }
);

// ============================================
// Server Action Interfaces
// ============================================

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

// ============================================
// Form Component Props
// ============================================

export interface DiscountBreakdownProps {
  receptionId: string;
  isEditable?: boolean;
  onDiscountChange?: (calculation: WeightDiscountCalculation) => void;
  onOverrideSubmit?: (override: AdminDiscountOverrideRequest) => void;
}

export interface PricingPreviewProps {
  totalWeight: number;
  qualityData: QualityEvaluationData;
  fruitTypeId: string;
  onCalculationComplete?: (calculation: WeightDiscountCalculation) => void;
}

// ============================================
// Error Types
// ============================================

export class DiscountCalculationError extends Error {
  constructor(
    message: string,
    public code: string,
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
} as const;

export type DiscountErrorCode = typeof DiscountErrorCodes[keyof typeof DiscountErrorCodes];