import { z } from '@builder.io/qwik-city';

export const CreateQualityEvaluationSchema = z.object({
    receptionId: z.string().uuid('ID de recepción inválido'),
    violetas: z.number().min(0).max(100, 'El porcentaje debe estar entre 0 y 100'),
    humedad: z.number().min(0).max(100, 'El porcentaje debe estar entre 0 y 100'),
    moho: z.number().min(0).max(100, 'El porcentaje debe estar entre 0 y 100'),
});

export const CreateLabSampleSchema = z.object({
    receptionId: z.string().uuid('ID de recepción inválido'),
    sampleWeight: z.number().positive('El peso de la muestra debe ser mayor a 0'),
    estimatedDryingDays: z.number().int().positive('Los días estimados deben ser un número entero positivo'),
});

export const UpdateLabSampleSchema = z.object({
    id: z.string().uuid('ID de muestra inválido'),
    driedSampleKg: z.number().positive('El peso seco debe ser mayor a 0').optional(),
    violetasPercentage: z.number().min(0).max(100).optional(),
    mohoPercentage: z.number().min(0).max(100).optional(),
    basuraPercentage: z.number().min(0).max(100).optional(),
    status: z.enum(['Drying', 'Analysis', 'Completed']),
});
