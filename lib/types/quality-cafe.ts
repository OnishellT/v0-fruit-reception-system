// TypeScript types for Quality Evaluation feature
// File: lib/types/quality-cafe.ts
// Date: 2025-10-31

/**
 * Quality evaluation data for Café Seco receptions
 */
export interface CalidadCafe {
  id: string;
  recepcion_id: string;
  violetas: number;
  humedad: number;
  moho: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input data for creating a new quality evaluation
 */
export interface CreateQualityEvaluationData {
  recepcion_id: string;
  violetas: number;
  humedad: number;
  moho: number;
}

/**
 * Input data for updating an existing quality evaluation
 */
export interface UpdateQualityEvaluationData {
  violetas?: number;
  humedad?: number;
  moho?: number;
}

/**
 * Quality evaluation with full reception details
 */
export interface QualityEvaluationWithReception {
  quality: CalidadCafe | null;
  reception: {
    id: string;
    reception_number: string;
    provider_id: string;
    driver_id: string;
    fruit_type: string;
    fruit_subtype: string;
    total_containers: number;
    total_weight: number;
    status: string;
    created_at: string;
  };
  created_by_user: {
    id: string;
    username: string;
  };
  updated_by_user: {
    id: string;
    username: string;
  };
}

/**
 * Server action response types
 */
export interface QualityEvaluationResponse {
  success: boolean;
  data?: CalidadCafe;
  error?: string;
}

export interface QualityEvaluationWithReceptionResponse {
  success: boolean;
  data?: QualityEvaluationWithReception | null;
  error?: string;
}

/**
 * Modal component props
 */
export interface QualityEvaluationModalProps {
  recepcionId: string;
  reception: {
    id: string;
    reception_number: string;
    fruit_type: string;
    fruit_subtype: string;
  };
  userRole: 'admin' | 'operator';
  existingQuality?: {
    id: string;
    violetas: number;
    humedad: number;
    moho: number;
  } | null;
  onSaved?: () => void;
  onClose?: () => void;
  isOpen: boolean;
}

/**
 * Form state for quality evaluation modal
 */
export interface QualityFormData {
  violetas: string;
  humedad: string;
  moho: string;
}

export interface QualityFormState {
  data: QualityFormData;
  isSubmitting: boolean;
  errors: {
    violetas?: string;
    humedad?: string;
    moho?: string;
    general?: string;
  };
  isDirty: boolean;
}
