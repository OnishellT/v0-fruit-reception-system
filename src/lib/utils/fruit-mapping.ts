import { db } from '~/lib/db';
import { fruitTypes, cashFruitTypes } from '~/lib/db/schema';
import { eq, ilike, and } from 'drizzle-orm';

export async function getFruitTypeUuidForCashId(cashId: number): Promise<string | null> {
    // 1. Get cash fruit type name
    const cashType = await db.query.cashFruitTypes.findFirst({
        where: eq(cashFruitTypes.id, cashId),
        columns: { name: true, code: true }
    });

    if (!cashType) return null;

    // 2. Find matching regular fruit type
    // Strategy: Look for type matching code/name. Prefer 'Verde' subtype for Cacao/Coffee if multiple exist.
    const namePattern = `%${cashType.name}%`;
    const codePattern = `%${cashType.code}%`;

    const matches = await db.select().from(fruitTypes).where(
        and(
            eq(fruitTypes.isActive, true),
            // Simple matching logic - can be improved
            // For now, assume type column matches cash code (CACAO, CAFE, MIEL)
            ilike(fruitTypes.type, cashType.code)
        )
    );

    if (matches.length === 0) return null;

    // 3. Select best match
    // Prefer 'Verde' or 'Standard' or generic
    const bestMatch = matches.find(m => m.subtype.toLowerCase().includes('verde')) || matches[0];

    return bestMatch.id;
}
