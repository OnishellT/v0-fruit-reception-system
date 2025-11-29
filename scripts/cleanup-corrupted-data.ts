
import { db } from '../src/lib/db';
import { receptions, cacaoBatches, batchReceptions, laboratorySamples } from '../src/lib/db/schema';
import { eq, sql, isNull, or, inArray } from 'drizzle-orm';

async function main() {
    console.log('--- Cleaning Up Corrupted Data ---');

    // 1. Find Broken Batches (Null or <= 0 Wet Weight)
    const brokenBatches = await db.select().from(cacaoBatches).where(
        or(
            isNull(cacaoBatches.totalWetWeight),
            sql`${cacaoBatches.totalWetWeight} <= 0`
        )
    );

    if (brokenBatches.length > 0) {
        console.log(`Found ${brokenBatches.length} broken batches. Deleting...`);
        const batchIds = brokenBatches.map(b => b.id);

        // Clear references
        await db.update(receptions)
            .set({ fBatchId: null })
            .where(inArray(receptions.fBatchId, batchIds));

        await db.update(laboratorySamples)
            .set({ batchId: null })
            .where(inArray(laboratorySamples.batchId, batchIds));

        // Delete relations
        await db.delete(batchReceptions).where(inArray(batchReceptions.batchId, batchIds));

        // Delete batches
        await db.delete(cacaoBatches).where(inArray(cacaoBatches.id, batchIds));

        console.log('Broken batches deleted.');
    } else {
        console.log('No broken batches found.');
    }

    // 2. Fix Receptions with NaN totalPesoDried
    console.log('\nFixing Receptions with NaN totalPesoDried...');
    // Note: 'NaN' string in numeric column? Postgres numeric doesn't support NaN usually, 
    // but Drizzle might be casting. If it's stored as 'NaN' string in a varchar/text column?
    // Schema says `numeric`. Postgres `numeric` throws error for NaN.
    // But `receptions.totalPesoDried` is `numeric`.
    // Let's check if we can find them via SQL.
    // If they are truly 'NaN', they might be stored as such if the column allows it (Postgres numeric supports 'NaN' in some versions/configs, or if it's text).

    // Let's try to update any that match 'NaN' string if possible, or just reset those that are invalid.
    // Since we can't easily query for NaN in numeric in standard SQL without casting,
    // we'll fetch all non-nulls and check in JS.

    const allDried = await db.select({ id: receptions.id, val: receptions.totalPesoDried }).from(receptions)
        .where(sql`${receptions.totalPesoDried} IS NOT NULL`);

    const nanReceptions = allDried.filter(r => r.val === 'NaN' || isNaN(Number(r.val)));

    if (nanReceptions.length > 0) {
        console.log(`Found ${nanReceptions.length} receptions with NaN dried weight. Resetting to null...`);
        const ids = nanReceptions.map(r => r.id);
        await db.update(receptions)
            .set({ totalPesoDried: null })
            .where(inArray(receptions.id, ids));
        console.log('Receptions fixed.');
    } else {
        console.log('No NaN receptions found (via JS check).');
    }

    // 3. Fix Batch Receptions with NaN
    console.log('\nFixing Batch Receptions with NaN values...');
    const allBatchReceptions = await db.select().from(batchReceptions);
    const nanBatchReceptions = allBatchReceptions.filter(br =>
        br.wetWeightContribution === 'NaN' || isNaN(Number(br.wetWeightContribution)) ||
        br.proportionalDriedWeight === 'NaN' || (br.proportionalDriedWeight && isNaN(Number(br.proportionalDriedWeight)))
    );

    if (nanBatchReceptions.length > 0) {
        console.log(`Found ${nanBatchReceptions.length} batch_receptions with NaN. Deleting their batches...`);
        const batchIds = [...new Set(nanBatchReceptions.map(br => br.batchId))];

        // Clear references
        await db.update(receptions)
            .set({ fBatchId: null })
            .where(inArray(receptions.fBatchId, batchIds));

        await db.update(laboratorySamples)
            .set({ batchId: null })
            .where(inArray(laboratorySamples.batchId, batchIds));

        // Delete relations
        await db.delete(batchReceptions).where(inArray(batchReceptions.batchId, batchIds));

        // Delete batches
        await db.delete(cacaoBatches).where(inArray(cacaoBatches.id, batchIds));
        console.log('Batches with NaN values deleted.');
    } else {
        console.log('No NaN batch_receptions found.');
    }
}

main().catch(console.error).then(() => process.exit(0));
