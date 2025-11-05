/**
 * Cash POS Price Lookup Utilities
 *
 * Handles price snapshot creation and lookup for cash receptions.
 * Prices are immutable once associated with a reception.
 */

import { db } from '@/lib/db';
import { cashDailyPrices } from '@/lib/db/schema';

export interface PriceLookupResult {
  id: number;
  fruitTypeId: number;
  priceDate: string;
  pricePerKg: number | string; // Database returns string for numeric
  createdAt: Date | string; // Database returns Date
  createdBy: string;
  active: boolean;
}

/**
 * Find active price for a fruit type on a specific date
 *
 * @param fruitTypeId - Fruit type ID
 * @param date - Date to find price for (defaults to today)
 * @returns Active price or null if not found
 */
export async function getActivePrice(
  fruitTypeId: number,
  date: Date = new Date()
): Promise<PriceLookupResult | null> {
  // Convert date to YYYY-MM-DD format
  const dateStr = date.toISOString().split('T')[0];

  const price = await db.query.cashDailyPrices.findFirst({
    where: (prices, { eq, and }) =>
      and(
        eq(prices.fruitTypeId, fruitTypeId),
        eq(prices.priceDate, dateStr),
        eq(prices.active, true)
      ),
    orderBy: (prices, { desc }) => [desc(prices.createdAt)],
  });

  return price || null;
}

/**
 * Get all active prices for a date range
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of active prices
 */
export async function getActivePricesInRange(
  startDate: Date,
  endDate: Date
): Promise<PriceLookupResult[]> {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const prices = await db.query.cashDailyPrices.findMany({
    where: (prices, { eq, gte, lte, and }) =>
      and(
        gte(prices.priceDate, startStr),
        lte(prices.priceDate, endStr),
        eq(prices.active, true)
      ),
    orderBy: (prices, { asc }) => [asc(prices.priceDate), asc(prices.fruitTypeId)],
  });

  return prices;
}

/**
 * Validate price exists for reception creation
 *
 * @param fruitTypeId - Fruit type ID
 * @param date - Date to check
 * @throws Error if no price found
 */
export async function validatePriceExists(
  fruitTypeId: number,
  date: Date = new Date()
): Promise<PriceLookupResult> {
  const price = await getActivePrice(fruitTypeId, date);

  if (!price) {
    const dateStr = date.toISOString().split('T')[0];
    throw new Error(`No active price found for fruit type ${fruitTypeId} on date ${dateStr}`);
  }

  return price;
}

/**
 * Get price history for a fruit type
 *
 * @param fruitTypeId - Fruit type ID
 * @param limit - Maximum number of records to return
 * @returns Price history ordered by date descending
 */
export async function getPriceHistory(
  fruitTypeId: number,
  limit: number = 10
): Promise<PriceLookupResult[]> {
  const prices = await db.query.cashDailyPrices.findMany({
    where: (prices, { eq }) => eq(prices.fruitTypeId, fruitTypeId),
    orderBy: (prices, { desc }) => [desc(prices.priceDate), desc(prices.createdAt)],
    limit,
  });

  return prices;
}

/**
 * Check if price is reasonable (within expected range)
 *
 * @param pricePerKg - Price to validate
 * @param fruitTypeId - Fruit type for context
 * @returns Validation result
 */
export function validatePriceRange(
  pricePerKg: number,
  fruitTypeId?: number
): { isValid: boolean; message?: string } {
  if (pricePerKg <= 0) {
    return { isValid: false, message: 'Price must be positive' };
  }

  if (pricePerKg > 1000) {
    return { isValid: false, message: 'Price cannot exceed RD$ 1,000.00 per kg' };
  }

  // Could add fruit-type specific validation here
  // e.g., Café prices typically range from RD$ 50-200

  return { isValid: true };
}