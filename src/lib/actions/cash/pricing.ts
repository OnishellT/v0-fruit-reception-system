import { db } from '~/lib/db';
import { cashDailyPrices, cashFruitTypes } from '~/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface CreateCashPriceData {
    fruitTypeId: number;
    priceDate: string;
    pricePerKg: number;
    createdBy: string;
}

export interface UpdateCashPriceData {
    id: number;
    pricePerKg: number;
    active: boolean;
}

export async function createCashPrice(data: CreateCashPriceData) {
    try {
        // Check for duplicate (same fruit type + same date)
        const existing = await db
            .select()
            .from(cashDailyPrices)
            .where(
                and(
                    eq(cashDailyPrices.fruitTypeId, data.fruitTypeId),
                    eq(cashDailyPrices.priceDate, data.priceDate)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return {
                success: false,
                error: 'Ya existe un precio para esta fruta en esta fecha'
            };
        }

        const [newPrice] = await db
            .insert(cashDailyPrices)
            .values({
                fruitTypeId: data.fruitTypeId,
                priceDate: data.priceDate,
                pricePerKg: data.pricePerKg.toString(),
                createdBy: data.createdBy,
                active: true,
            })
            .returning();

        return { success: true, data: newPrice };
    } catch (error) {
        console.error('Error creating cash price:', error);
        return { success: false, error: 'Error al crear el precio' };
    }
}

export async function updateCashPrice(data: UpdateCashPriceData) {
    try {
        const [updated] = await db
            .update(cashDailyPrices)
            .set({
                pricePerKg: data.pricePerKg.toString(),
                active: data.active,
            })
            .where(eq(cashDailyPrices.id, data.id))
            .returning();

        return { success: true, data: updated };
    } catch (error) {
        console.error('Error updating cash price:', error);
        return { success: false, error: 'Error al actualizar el precio' };
    }
}

export async function getActivePriceForDate(fruitTypeId: number, date: string) {
    try {
        const [price] = await db
            .select()
            .from(cashDailyPrices)
            .where(
                and(
                    eq(cashDailyPrices.fruitTypeId, fruitTypeId),
                    eq(cashDailyPrices.priceDate, date),
                    eq(cashDailyPrices.active, true)
                )
            )
            .limit(1);

        return price || null;
    } catch (error) {
        console.error('Error fetching active price:', error);
        return null;
    }
}

export async function getAllCashPrices() {
    try {
        const prices = await db
            .select({
                id: cashDailyPrices.id,
                fruitTypeId: cashDailyPrices.fruitTypeId,
                fruitTypeName: cashFruitTypes.name,
                priceDate: cashDailyPrices.priceDate,
                pricePerKg: cashDailyPrices.pricePerKg,
                active: cashDailyPrices.active,
                createdAt: cashDailyPrices.createdAt,
                createdBy: cashDailyPrices.createdBy,
            })
            .from(cashDailyPrices)
            .innerJoin(cashFruitTypes, eq(cashDailyPrices.fruitTypeId, cashFruitTypes.id))
            .orderBy(desc(cashDailyPrices.priceDate), desc(cashDailyPrices.createdAt));

        return prices;
    } catch (error) {
        console.error('Error fetching all cash prices:', error);
        return [];
    }
}
