/**
 * Daily price management for pricing system
 * Migrated from Next.js to Qwik City
 */

import { db } from '~/lib/db';
import { dailyPrices } from '~/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Create a new daily price
 */
export async function createDailyPriceUtil(data: {
    fruitTypeId: string;
    pricePerKg: number;
    priceDate: Date;
}, userId: string) {
    try {
        // Deactivate existing price for this fruit type and date if exists
        // (Optional: depending on business logic, maybe we want multiple prices or just overwrite)
        // For now, let's just insert a new one. The query logic usually takes the latest or active one.

        const result = await db.insert(dailyPrices).values({
            fruitTypeId: data.fruitTypeId,
            pricePerKg: data.pricePerKg.toString(),
            priceDate: data.priceDate.toISOString().split('T')[0], // YYYY-MM-DD
            active: true,
            createdBy: userId,
        }).returning();

        return { success: true, data: result[0] };
    } catch (error) {
        console.error('Error creating daily price:', error);
        return { success: false, error: 'Error creating daily price' };
    }
}

/**
 * Get daily price for a specific fruit type and date
 * This is a reusable utility function (not a route action)
 * 
 * @param fruitTypeId - UUID of the fruit type
 * @param priceDate - Date in YYYY-MM-DD format
 * @returns Daily price object or null if not found
 */
export async function getDailyPrice(fruitTypeId: string, priceDate: string) {
    try {
        console.log('🔍 getDailyPrice called with:', { fruitTypeId, priceDate });

        // Query the database for active daily price
        const priceData = await db
            .select()
            .from(dailyPrices)
            .where(
                and(
                    eq(dailyPrices.fruitTypeId, fruitTypeId),
                    eq(dailyPrices.priceDate, priceDate),
                    eq(dailyPrices.active, true)
                )
            )
            .limit(1);

        console.log('📊 Daily price query result:', priceData);

        if (priceData.length === 0) {
            console.log('⚠️ No daily price found for:', { fruitTypeId, priceDate });
            return null;
        }

        // Parse and return the price data
        const result = {
            id: priceData[0].id,
            fruitTypeId: priceData[0].fruitTypeId,
            priceDate: priceData[0].priceDate,
            pricePerKg: parseFloat(priceData[0].pricePerKg.toString()),
            active: priceData[0].active,
        };

        console.log('✅ Daily price found:', result);
        return result;
    } catch (error) {
        console.error('❌ Error getting daily price:', error);
        // Don't throw the error, just return null to prevent breaking the reception creation
        return null;
    }
}

/**
 * Get all active daily prices for a fruit type
 * 
 * @param fruitTypeId - UUID of the fruit type
 * @returns Array of daily prices
 */
export async function getActivePricesForFruitType(fruitTypeId: string) {
    try {
        const prices = await db
            .select()
            .from(dailyPrices)
            .where(
                and(
                    eq(dailyPrices.fruitTypeId, fruitTypeId),
                    eq(dailyPrices.active, true)
                )
            )
            .orderBy(dailyPrices.priceDate);

        return prices.map(price => ({
            id: price.id,
            fruitTypeId: price.fruitTypeId,
            priceDate: price.priceDate,
            pricePerKg: parseFloat(price.pricePerKg.toString()),
            active: price.active,
            createdAt: price.createdAt,
            createdBy: price.createdBy,
        }));
    } catch (error) {
        console.error('❌ Error getting active prices:', error);
        return [];
    }
}

/**
 * Get the most recent daily price for a fruit type
 * Useful for defaulting to the latest price when date is not specified
 * 
 * @param fruitTypeId - UUID of the fruit type
 * @returns Latest daily price or null
 */
export async function getLatestDailyPrice(fruitTypeId: string) {
    try {
        const prices = await db
            .select()
            .from(dailyPrices)
            .where(
                and(
                    eq(dailyPrices.fruitTypeId, fruitTypeId),
                    eq(dailyPrices.active, true)
                )
            )
            .orderBy(desc(dailyPrices.priceDate))
            .limit(1);

        if (prices.length === 0) {
            return null;
        }

        return {
            id: prices[0].id,
            fruitTypeId: prices[0].fruitTypeId,
            priceDate: prices[0].priceDate,
            pricePerKg: parseFloat(prices[0].pricePerKg.toString()),
            active: prices[0].active,
        };
    } catch (error) {
        console.error('❌ Error getting latest price:', error);
        return null;
    }
}
