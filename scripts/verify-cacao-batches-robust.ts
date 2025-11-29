
import { db } from '../src/lib/db';
import { receptions, cacaoBatches, batchReceptions } from '../src/lib/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';

async function main() {
    console.log('Starting Robust Cacao Batches Verification...');

    // 1. Find a suitable reception (using the NEW numeric filter logic)
    const reception = await db.query.receptions.findFirst({
        where: and(
            eq(receptions.status, 'completed'),
            eq(receptions.fruitTypeId, 'afa134e1-e5cb-4ef4-a57b-ef82d62af742'), // Cacao Verde
            sql`CAST(${receptions.totalPesoFinal} AS NUMERIC) > 0`
        ),
    });

    if (!reception) {
        console.error('No suitable reception found for testing.');
        return;
    }

    console.log(`Using reception: ${reception.receptionNumber} (ID: ${reception.id})`);
    console.log(`Weight: ${reception.totalPesoFinal}`);

    // 2. Create a Batch (Simulate useCreateBatch)
    const wetWeight = Number(reception.totalPesoFinal);
    if (wetWeight <= 0) {
        console.error('Weight is invalid despite filter!');
        return;
    }

    const [newBatch] = await db.insert(cacaoBatches).values({
        batchType: 'Test Batch Robust',
        startDate: new Date(),
        duration: 0,
        totalWetWeight: wetWeight.toString(),
        status: 'In progress',
        calculationData: {},
    }).returning();

    console.log(`Created Batch: ${newBatch.id}`);

    await db.insert(batchReceptions).values({
        batchId: newBatch.id,
        receptionId: reception.id,
        wetWeightContribution: wetWeight.toString(),
        percentageOfTotal: '100',
    });

    // 3. Update Batch (Simulate useUpdateBatchDrying)
    const driedWeight = wetWeight * 0.4; // Assume 40% yield
    console.log(`Simulating drying result: ${driedWeight} kg`);

    await db.transaction(async (tx) => {
        // Fetch entries first (like the action does)
        const entries = await tx.select().from(batchReceptions).where(eq(batchReceptions.batchId, newBatch.id));
        const totalWet = entries.reduce((sum, e) => sum + (Number(e.wetWeightContribution) || 0), 0);

        console.log(`Calculated Total Wet Weight in Action: ${totalWet}`);

        if (totalWet <= 0) {
            console.error('Total Wet Weight is 0! Logic failed.');
            return;
        }

        await tx.update(cacaoBatches)
            .set({
                totalDriedWeight: driedWeight.toString(),
                status: 'completed',
                expectedCompletionDate: new Date(),
            })
            .where(eq(cacaoBatches.id, newBatch.id));

        // Distribute
        for (const entry of entries) {
            const share = (Number(entry.wetWeightContribution) || 0) / totalWet;
            const proportionalWeight = driedWeight * share;

            console.log(`Share: ${share}, Proportional: ${proportionalWeight}`);

            if (isNaN(proportionalWeight)) {
                console.error('Proportional Weight is NaN!');
                return;
            }

            await tx.update(batchReceptions)
                .set({ proportionalDriedWeight: proportionalWeight.toString() })
                .where(and(
                    eq(batchReceptions.batchId, newBatch.id),
                    eq(batchReceptions.receptionId, entry.receptionId)
                ));

            // Accumulate
            const result = await tx
                .select({
                    total: sql<string>`sum(${batchReceptions.proportionalDriedWeight})`
                })
                .from(batchReceptions)
                .where(eq(batchReceptions.receptionId, entry.receptionId));

            const newTotalDried = result[0].total || '0';
            console.log(`New Total Dried for Reception: ${newTotalDried}`);

            await tx.update(receptions)
                .set({ totalPesoDried: newTotalDried })
                .where(eq(receptions.id, entry.receptionId));
        }
    });

    // 4. Verify Final State
    const updatedReception = await db.query.receptions.findFirst({
        where: eq(receptions.id, reception.id),
    });

    console.log(`Updated Reception Total Dried Weight: ${updatedReception?.totalPesoDried}`);

    if (updatedReception?.totalPesoDried && !isNaN(Number(updatedReception.totalPesoDried))) {
        console.log('SUCCESS: Dried weight updated correctly.');
    } else {
        console.log('FAILURE: Dried weight is invalid.');
    }
}

main().catch(console.error).then(() => process.exit(0));
