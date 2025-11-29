import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { qualityEvaluations, laboratorySamples } from '~/lib/db/schema';

// Database Models
export type QualityEvaluation = InferSelectModel<typeof qualityEvaluations>;
export type NewQualityEvaluation = InferInsertModel<typeof qualityEvaluations>;

export type LaboratorySample = InferSelectModel<typeof laboratorySamples>;
export type NewLaboratorySample = InferInsertModel<typeof laboratorySamples>;

// Form Data Types
export interface CreateQualityEvaluationData {
    receptionId: string;
    violetas: number;
    humedad: number;
    moho: number;
}

export interface CreateLabSampleData {
    receptionId?: string;
    batchId?: string;
    sampleWeight: number;
    estimatedDryingDays: number;
}

export interface UpdateLabSampleData {
    id: string;
    driedSampleKg?: number;
    violetasPercentage?: number;
    mohoPercentage?: number;
    basuraPercentage?: number;
    status: 'Drying' | 'Analysis' | 'Completed';
}

export interface LabSampleSummary {
    id: string;
    receptionNumber: string;
    providerName: string;
    sampleWeight: number;
    status: string;
    createdAt: Date;
}
