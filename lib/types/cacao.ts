import { z } from 'zod';
import {
  CacaoBatchSchema,
  BatchReceptionSchema,
  LaboratorySampleSchema,
  CreateCacaoBatchSchema,
  UpdateCacaoBatchSchema,
  CreateLaboratorySampleSchema,
  UpdateLaboratorySampleSchema,
} from '../schemas/cacao';

export type CacaoBatch = z.infer<typeof CacaoBatchSchema>;
export type BatchReception = z.infer<typeof BatchReceptionSchema>;
export type LaboratorySample = z.infer<typeof LaboratorySampleSchema>;
export type CreateCacaoBatch = z.infer<typeof CreateCacaoBatchSchema>;
export type UpdateCacaoBatch = z.infer<typeof UpdateCacaoBatchSchema>;
export type CreateLaboratorySample = z.infer<typeof CreateLaboratorySampleSchema>;
export type UpdateLaboratorySample = z.infer<typeof UpdateLaboratorySampleSchema>;
