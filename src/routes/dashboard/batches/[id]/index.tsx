
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, z, zod$, useNavigate, Form } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cacaoBatches, batchReceptions, receptions, providers } from '~/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { ArrowLeftIcon, SaveIcon, CheckCircleIcon } from 'lucide-qwik';

// Loader to fetch batch details
export const useBatchDetails = routeLoader$(async ({ params }) => {
    const batchId = params.id;

    const batch = await db.query.cacaoBatches.findFirst({
        where: eq(cacaoBatches.id, batchId),
    });

    if (!batch) return null;

    const batchEntries = await db
        .select({
            receptionNumber: receptions.receptionNumber,
            providerName: providers.name,
            wetWeightContribution: batchReceptions.wetWeightContribution,
            percentageOfTotal: batchReceptions.percentageOfTotal,
            proportionalDriedWeight: batchReceptions.proportionalDriedWeight,
        })
        .from(batchReceptions)
        .leftJoin(receptions, eq(batchReceptions.receptionId, receptions.id))
        .leftJoin(providers, eq(receptions.providerId, providers.id))
        .where(eq(batchReceptions.batchId, batchId));

    return {
        ...batch,
        entries: batchEntries,
    };
});

// Action to update batch drying result
export const useUpdateBatchDrying = routeAction$(async (data, { params, redirect, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) return { success: false, error: 'Unauthorized' };

    const batchId = params.id;
    const totalDriedWeight = Number(data.totalDriedWeight);

    if (isNaN(totalDriedWeight) || totalDriedWeight <= 0) {
        return { success: false, error: 'El peso seco debe ser un número válido mayor a 0.' };
    }

    // Fetch batch receptions to distribute weight
    const entries = await db
        .select()
        .from(batchReceptions)
        .where(eq(batchReceptions.batchId, batchId));

    const totalWetWeight = entries.reduce((sum, e) => sum + (Number(e.wetWeightContribution) || 0), 0);

    await db.transaction(async (tx) => {
        // 1. Update Batch
        await tx.update(cacaoBatches)
            .set({
                totalDriedWeight: totalDriedWeight.toString(),
                status: 'completed',
                expectedCompletionDate: new Date(), // Actual completion
            })
            .where(eq(cacaoBatches.id, batchId));

        // 2. Distribute Dried Weight
        for (const entry of entries) {
            let share = 0;
            if (totalWetWeight > 0) {
                share = (Number(entry.wetWeightContribution) || 0) / totalWetWeight;
            }

            const proportionalWeight = totalDriedWeight * share;

            // Update batch reception entry
            await tx.update(batchReceptions)
                .set({
                    proportionalDriedWeight: proportionalWeight.toString(),
                })
                .where(and(
                    eq(batchReceptions.batchId, batchId),
                    eq(batchReceptions.receptionId, entry.receptionId)
                ));

            // 3. Update Reception Total Dried Weight (Accumulate)
            // We need to fetch the current total and add this new amount
            // OR simpler: Recalculate the sum from all batches for this reception
            // This is safer against race conditions or double counting if we re-run this.

            // Find all batches this reception is part of
            const allBatchEntries = await tx
                .select({ weight: batchReceptions.proportionalDriedWeight })
                .from(batchReceptions)
                .where(eq(batchReceptions.receptionId, entry.receptionId));

            // Sum up (including the one we just updated, but wait, we just updated it in the DB? Yes)
            // Note: The select above might not see the update if it's in the same transaction depending on isolation level,
            // but usually it does in Postgres Read Committed (default).
            // Let's be explicit: we know the new value.

            // Actually, let's just sum all *completed* batch contributions.
            // But wait, we just updated this one.

            // Let's do a direct update increment? No, `totalPesoDried` might be null initially.
            // Safer: Calculate sum of all proportionalDriedWeight for this receptionId where proportionalDriedWeight is not null.
            const result = await tx
                .select({
                    total: sql<string>`sum(${batchReceptions.proportionalDriedWeight})`
                })
                .from(batchReceptions)
                .where(eq(batchReceptions.receptionId, entry.receptionId));

            const newTotalDried = result[0].total || '0';

            await tx.update(receptions)
                .set({ totalPesoDried: newTotalDried })
                .where(eq(receptions.id, entry.receptionId));
        }
    });

    return { success: true };
}, zod$({
    totalDriedWeight: z.string(),
}));

export default component$(() => {
    const batchSignal = useBatchDetails();
    const updateAction = useUpdateBatchDrying();
    const nav = useNavigate();

    if (!batchSignal.value) return <div>Lote no encontrado</div>;

    const batch = batchSignal.value;

    return (
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <button onClick$={() => nav('/dashboard/batches')} class="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeftIcon class="w-6 h-6" />
                </button>
                <div>
                    <h1 class="text-2xl font-bold">Lote de Secado</h1>
                    <p class="text-gray-500 text-sm">ID: {batch.id.slice(0, 8)}</p>
                </div>
                <div class={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${batch.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {batch.status === 'completed' ? 'Completado' : 'En Proceso'}
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details Card */}
                <div class="lg:col-span-2 space-y-6">
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h2 class="text-lg font-semibold mb-4">Detalles del Proceso</h2>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm text-gray-500">Fecha Inicio</p>
                                <p class="font-medium">{new Date(batch.startDate).toLocaleString()}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Peso Húmedo Total</p>
                                <p class="font-medium text-lg">{Number(batch.totalWetWeight).toFixed(2)} kg</p>
                            </div>
                            {batch.totalDriedWeight && (
                                <div>
                                    <p class="text-sm text-gray-500">Peso Seco Total</p>
                                    <p class="font-medium text-lg text-green-600">{Number(batch.totalDriedWeight).toFixed(2)} kg</p>
                                </div>
                            )}
                            {batch.totalDriedWeight && (
                                <div>
                                    <p class="text-sm text-gray-500">Rendimiento</p>
                                    <p class="font-medium">
                                        {((Number(batch.totalDriedWeight) / Number(batch.totalWetWeight)) * 100).toFixed(2)}%
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-lg shadow">
                        <h2 class="text-lg font-semibold mb-4">Recepciones en este Lote</h2>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left">
                                <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-3">Recepción</th>
                                        <th class="px-4 py-3 text-right">Peso Húmedo</th>
                                        <th class="px-4 py-3 text-right">%</th>
                                        <th class="px-4 py-3 text-right">Peso Seco Asignado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batch.entries.map((entry, i) => (
                                        <tr key={i} class="border-b">
                                            <td class="px-4 py-3">
                                                <div class="font-medium">{entry.receptionNumber}</div>
                                                <div class="text-xs text-gray-500">{entry.providerName}</div>
                                            </td>
                                            <td class="px-4 py-3 text-right">{Number(entry.wetWeightContribution).toFixed(2)}</td>
                                            <td class="px-4 py-3 text-right">{Number(entry.percentageOfTotal).toFixed(2)}%</td>
                                            <td class="px-4 py-3 text-right font-medium">
                                                {entry.proportionalDriedWeight ? Number(entry.proportionalDriedWeight).toFixed(2) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Action Card */}
                <div class="space-y-6">
                    {batch.status !== 'completed' ? (
                        <div class="bg-white p-6 rounded-lg shadow">
                            <h2 class="text-lg font-semibold mb-4">Finalizar Secado</h2>
                            <p class="text-sm text-gray-600 mb-4">
                                Ingrese el peso total seco obtenido del lote. El sistema distribuirá este peso proporcionalmente a las recepciones originales.
                            </p>
                            <Form action={updateAction} class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Peso Seco Total (kg)</label>
                                    <input
                                        type="number"
                                        name="totalDriedWeight"
                                        step="0.01"
                                        required
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    class="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                                >
                                    <CheckCircleIcon class="w-5 h-5" />
                                    Finalizar y Distribuir
                                </button>
                            </Form>
                        </div>
                    ) : (
                        <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                            <div class="flex items-center gap-2 text-green-800 font-semibold mb-2">
                                <CheckCircleIcon class="w-5 h-5" />
                                Lote Completado
                            </div>
                            <p class="text-sm text-green-700">
                                El peso seco ha sido distribuido y asignado a las recepciones correspondientes.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
