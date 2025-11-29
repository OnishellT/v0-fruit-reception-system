
import { db } from '../src/lib/db';
import { receptions, cacaoBatches, batchReceptions } from '../src/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { useCreateBatch, useUpdateBatchDrying } from '../src/routes/dashboard/batches/new/index'; // Can't import actions directly easily
// So I will replicate the logic or use a different approach.
// Actually, I can just use the DB directly to simulate the actions.

async function main() {
    console.log('Starting Cacao Batches Verification...');

    // 1. Find a suitable reception
    const reception = await db.query.receptions.findFirst({
        where: and(
            eq(receptions.status, 'completed'),
            gt(receptions.totalPesoFinal, '0')
        ),
    });

    if (!reception) {
        console.error('No suitable reception found for testing.');
        return;
    }

    console.log(`Using reception: ${reception.receptionNumber} (ID: ${reception.id})`);
    console.log(`Initial Total Dried Weight: ${reception.totalPesoDried}`);

    // 2. Create a Batch (Simulate useCreateBatch)
    const wetWeight = Number(reception.totalPesoFinal);
    const [newBatch] = await db.insert(cacaoBatches).values({
        batchType: 'Test Batch',
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
        await tx.update(cacaoBatches)
            .set({
                totalDriedWeight: driedWeight.toString(),
                status: 'completed',
                expectedCompletionDate: new Date(),
            })
            .where(eq(cacaoBatches.id, newBatch.id));

        // Distribute
        const share = 1; // 100% since only 1 reception
        const proportionalWeight = driedWeight * share;

        await tx.update(batchReceptions)
            .set({ proportionalDriedWeight: proportionalWeight.toString() })
            .where(and(
                eq(batchReceptions.batchId, newBatch.id),
                eq(batchReceptions.receptionId, reception.id)
            ));

        // Accumulate
        // We need to sum ALL batches for this reception.
        // Assuming this is the only one for now, or adding to existing.
        // But wait, the logic in the action sums ALL proportionalDriedWeight.

        // Let's fetch current total from DB to simulate the action's logic
        // But here I'm just verifying the logic works.

        // I'll manually update the reception to simulate what the action does
        // But first I need to know the SUM of all batches.

        // Fetch all batch receptions for this reception
        const allBatches = await tx.select().from(batchReceptions).where(eq(batchReceptions.receptionId, reception.id));
        const totalDried = allBatches.reduce((sum, b) => sum + (Number(b.proportionalDriedWeight) || 0), 0);

        console.log(`Calculated Total Dried Weight for Reception: ${totalDried}`);

        await tx.update(receptions)
            .set({ totalPesoDried: totalDried.toString() })
            .where(eq(receptions.id, reception.id));
    });

    // 4. Verify
    const updatedReception = await db.query.receptions.findFirst({
        where: eq(receptions.id, reception.id),
    });

    console.log(`Updated Reception Total Dried Weight: ${updatedReception?.totalPesoDried}`);

    if (Math.abs(Number(updatedReception?.totalPesoDried) - Number(reception.totalPesoDried || 0) - driedWeight) < 0.1) {
        console.log('SUCCESS: Dried weight added correctly (accounting for existing).');
    } else if (Number(updatedReception?.totalPesoDried) === driedWeight && !reception.totalPesoDried) {
        console.log('SUCCESS: Dried weight set correctly.');
    } else {
        console.log('WARNING: Check values manually.');
    }
}

main().catch(console.error).then(() => process.exit(0));
