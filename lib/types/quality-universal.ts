/**
 * Universal Quality Evaluation Types
 * Replaces quality-cafe.ts for all fruit types
 */

export interface QualityEvaluation {
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

export interface CreateQualityEvaluationData {
  recepcion_id: string;
  violetas?: number;
  humedad?: number;
  moho?: number;
}

export interface UpdateQualityEvaluationData {
  violetas?: number;
  humedad?: number;
  moho?: number;
}

export interface QualityEvaluationResponse {
  success: boolean;
  data?: QualityEvaluation;
  error?: string;
}

export interface QualityEvaluationWithReception {
  quality: QualityEvaluation | null;
  reception: {
    id: string;
    reception_number: string;
    provider_id: string;
    driver_id: string;
    fruit_type_id: string;
    truck_plate: string;
    total_containers: number;
    total_weight: number;
    status: string;
    created_at: string;
    fruit_type: string;
    fruit_subtype: string;
  };
  created_by_user?: {
    id: string;
    username: string;
  } | null;
  updated_by_user?: {
    id: string;
    username: string;
  } | null;
}

export interface QualityEvaluationWithReceptionResponse {
  success: boolean;
  data?: QualityEvaluationWithReception;
  error?: string;
}

export interface QualityEvaluationModalProps {
  recepcionId: string;
  reception: {
    id: string;
    reception_number: string;
    fruit_type: string;
    fruit_subtype: string;
  };
  userRole: string;
  existingQuality?: QualityEvaluation | null;
  onSaved?: () => void;
  onClose?: () => void;
  isOpen: boolean;
}

export interface QualityFormData {
  violetas: string;
  humedad: string;
  moho: string;
}

export interface QualityMetric {
  metric: 'Violetas' | 'Humedad' | 'Moho';
  value: number;
}
