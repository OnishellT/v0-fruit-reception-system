import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { batchReceptions, laboratorySamples, fruitTypes } from '@/lib/db/schema';

// Batch Receptions
export const getBatchReceptions = async (batchId: string) => {
  const data = await db
    .select()
    .from(batchReceptions)
    .where(eq(batchReceptions.batchId, batchId));
  return data;
};

export const addReceptionToBatch = async (batchId: string, receptionId: string) => {
  const data = await db
    .insert(batchReceptions)
    .values({ batchId, receptionId })
    .returning();
  return data[0];
};

// Laboratory Samples
export const getLaboratorySamples = async (receptionId: string) => {
  const data = await db
    .select()
    .from(laboratorySamples)
    .where(eq(laboratorySamples.receptionId, receptionId));
  return data;
};

// Fruit Types
export const getFruitTypeBySubtype = async (type: string, subtype: string) => {
  const data = await db
    .select({ id: fruitTypes.id })
    .from(fruitTypes)
    .where(and(eq(fruitTypes.type, type), eq(fruitTypes.subtype, subtype)))
    .limit(1);

  if (data.length === 0) {
    throw new Error('Fruit type not found');
  }
  return data[0];
};
