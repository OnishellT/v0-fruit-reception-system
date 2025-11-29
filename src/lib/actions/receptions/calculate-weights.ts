import { db } from '~/lib/db';
import { receptions, receptionDetails, laboratorySamples, fruitTypes, qualityThresholds, desgloseDescuentos, qualityEvaluations } from '~/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { computeCashDiscounts } from '~/lib/utils/discounts';

export async function recalculateReceptionWeights(receptionId: string) {
    console.log(`Recalculating weights for reception ${receptionId}...`);

    // 1. Fetch reception and related data
    const reception = await db.query.receptions.findFirst({
        where: eq(receptions.id, receptionId),
        with: {
            fruitType: true,
            receptionDetails: true,
        }
    });

    if (!reception || !reception.fruitType) {
        console.error(`Reception ${receptionId} not found or missing fruit type`);
        return;
    }

    // 2. Check if Cacao Verde
    const isCacaoVerde = reception.fruitType.type.toUpperCase().includes('CACAO') &&
        reception.fruitType.subtype.toUpperCase().includes('VERDE');

    if (!isCacaoVerde) {
        console.log(`Reception ${receptionId} is not Cacao Verde. Skipping specific lab logic.`);
        return;
    }

    // 3. Calculate Original Weight (Sum of details)
    const originalWeight = reception.receptionDetails.reduce((sum, d) => sum + Number(d.weightKg), 0);

    // 4. Fetch Lab Samples
    const samples = await db.select().from(laboratorySamples).where(eq(laboratorySamples.receptionId, receptionId));

    // 3. Calculate Pending Lab Sample Weight (to be deducted)
    // Only deduct samples that are NOT 'completed'.
    // Completed samples are considered "returned" to the batch (or just not deducted).
    const pendingSamples = samples.filter(s => s.status?.toLowerCase() !== 'completed');
    const pendingWeight = pendingSamples.reduce((sum, s) => sum + (Number(s.sampleWeight) || 0), 0);

    // 4. Calculate Total Lab Sample Weight (for record keeping)
    const totalSampleWeight = samples.reduce((sum, s) => sum + (Number(s.sampleWeight) || 0), 0);
    const totalDriedSampleWeight = samples.reduce((sum, s) => sum + (Number(s.driedSampleKg) || 0), 0);

    // 5. Calculate Quality Discounts
    // Priority: Latest COMPLETED Lab Sample > Initial Quality Evaluation
    const completedSamples = samples.filter(s => s.status?.toLowerCase() === 'completed').sort((a, b) => {
        // Sort by ID as proxy for time or just take first found
        return 0;
    });

    let discountWeight = 0;
    let discountBreakdown: any[] = [];
    let qualityToUse = null;

    if (completedSamples.length > 0) {
        const latestSample = completedSamples[0]; // Take the first one found

        const wetWeight = Number(latestSample.sampleWeight) || 0;
        const dryWeight = Number(latestSample.driedSampleKg) || 0;

        // Calculate humidity if weights are available
        let calculatedHumidity = 0;
        if (wetWeight > 0 && dryWeight > 0) {
            calculatedHumidity = ((wetWeight - dryWeight) / wetWeight) * 100;
        }

        // Prepare quality object
        qualityToUse = {
            humedad: calculatedHumidity,
            moho: Number(latestSample.mohoPercentage) || 0,
            violetas: Number(latestSample.violetasPercentage) || 0,
        };
    } else {
        // Fallback to initial quality evaluation
        const initialQuality = await db.query.qualityEvaluations.findFirst({
            where: eq(qualityEvaluations.recepcionId, receptionId),
        });

        if (initialQuality) {
            qualityToUse = {
                humedad: Number(initialQuality.humedad) || 0,
                moho: Number(initialQuality.moho) || 0,
                violetas: Number(initialQuality.violetas) || 0,
            };
        }
    }

    if (qualityToUse) {
        // Fetch unified thresholds
        const thresholds = await db
            .select()
            .from(qualityThresholds)
            .where(and(
                eq(qualityThresholds.fruitTypeId, reception.fruitTypeId!),
                eq(qualityThresholds.enabled, true)
            ));

        const formattedThresholds = thresholds.map(t => ({
            fruitTypeId: 0,
            metric: t.metric,
            thresholdPercent: Number(t.thresholdPercent),
            enabled: t.enabled
        }));

        // Compute discounts
        // Note: computeCashDiscounts applies to the weight passed in. 
        // Should we apply to (Original - Pending)? Or just Original?
        // User said: "Apply the discount % to the original green weight"
        const result = computeCashDiscounts(originalWeight, formattedThresholds, qualityToUse);
        discountWeight = result.discountWeightKg;
        discountBreakdown = result.breakdown;

        console.log('Quality Discount Calculation:', {
            quality: qualityToUse,
            thresholds: formattedThresholds,
            discountWeight,
            breakdown: discountBreakdown
        });
    } else {
        console.log('No completed samples or initial quality found. Skipping quality discount.');
    }

    // 6. Calculate Final Weight
    // Logic:
    // 1. Start with Original Weight
    // 2. Subtract Quality Discount
    // 3. Handle Lab Samples:
    //    - We remove the Wet Sample Weight from the pile.
    //    - We add back the Dried Sample Weight (if available).
    //    - Net Adjustment = -(WetSample) + (DrySample)
    //    - Or: Final = Original - Discount - (WetSample - DrySample)

    const netSampleLoss = totalSampleWeight - totalDriedSampleWeight;

    // Total Deduction = Quality Discount + Net Sample Loss
    let totalDeduction = discountWeight + netSampleLoss;

    // Safety: Ensure we don't go negative
    if (totalDeduction > originalWeight) {
        console.warn(`Total deduction (${totalDeduction}) exceeds original weight (${originalWeight}). Clamping to original.`);
        totalDeduction = originalWeight;
    }

    const finalWeight = originalWeight - totalDeduction;

    console.log(`Recalculation Result: Original=${originalWeight}, SampleWet=${totalSampleWeight}, SampleDry=${totalDriedSampleWeight}, NetSampleLoss=${netSampleLoss}, QualityDiscount=${discountWeight}, TotalDeduction=${totalDeduction}, Final=${finalWeight}`);

    // 7. Update Database
    await db.transaction(async (tx) => {
        // Update reception
        await tx.update(receptions)
            .set({
                totalPesoOriginal: originalWeight.toString(),
                totalPesoDescuento: totalDeduction.toString(), // Includes sample loss to satisfy constraint
                totalPesoFinal: finalWeight.toString(),
                labSampleWetWeight: totalSampleWeight.toString(),
                labSampleDriedWeight: totalDriedSampleWeight.toString(),
                // Update totalPesoDried if it's null or 0, assuming it's at least the sample dried weight?
                // Or maybe we shouldn't touch it if it's for the whole batch.
                // Let's leave totalPesoDried alone for now unless explicitly asked, 
                // as it might be controlled by the batching system.
            })
            .where(eq(receptions.id, receptionId));

        // Update breakdown
        await tx.delete(desgloseDescuentos).where(eq(desgloseDescuentos.recepcionId, receptionId));

        if (discountBreakdown.length > 0) {
            await tx.insert(desgloseDescuentos).values(
                discountBreakdown.map(b => ({
                    recepcionId: receptionId,
                    parametro: b.parametro,
                    umbral: b.umbral.toString(),
                    valor: b.valor.toString(),
                    porcentajeDescuento: b.porcentajeDescuento.toString(),
                    pesoDescuento: b.pesoDescuento.toString(),
                    createdBy: reception.createdBy || reception.providerId, // Fallback
                }))
            );
        }
    });
}
