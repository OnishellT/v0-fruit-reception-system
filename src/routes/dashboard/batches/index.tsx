import { component$, useSignal } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cacaoBatches, receptions, batchReceptions, fruitTypes } from '~/lib/db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { PackageIcon, ListIcon } from 'lucide-qwik';

export const useCacaoData = routeLoader$(async ({ cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    // Available Receptions (Cacao Verde, not in batch, has weight)
    const availableReceptions = await db
        .select({
            id: receptions.id,
            receptionNumber: receptions.receptionNumber,
            fruitSubtype: fruitTypes.subtype,
            totalPesoFinal: receptions.totalPesoFinal,
            createdAt: receptions.createdAt,
        })
        .from(receptions)
        .innerJoin(fruitTypes, eq(receptions.fruitTypeId, fruitTypes.id))
        .where(and(
            eq(fruitTypes.type, 'CACAO'),
            eq(fruitTypes.subtype, 'Verde'),
            isNull(receptions.fBatchId),
            sql`CAST(${receptions.totalPesoFinal} AS NUMERIC) > 0`
        ))
        .orderBy(desc(receptions.createdAt));

    // Active Batches
    const activeBatches = await db
        .select()
        .from(cacaoBatches)
        .orderBy(desc(cacaoBatches.startDate));

    return {
        availableReceptions,
        activeBatches,
    };
});

export const useCreateBatch = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const { batchType, startDate, duration, receptionIds } = data;
    const selectedIds = receptionIds.split(',');

    if (selectedIds.length === 0) {
        return { success: false, message: 'Debe seleccionar al menos una recepción' };
    }

    // Fetch reception weights
    const receptionsWithWeights = await Promise.all(
        selectedIds.map(async (id) => {
            const rec = await db.query.receptions.findFirst({
                where: eq(receptions.id, id),
            });
            return {
                id,
                weight: Number(rec?.totalPesoFinal || 0),
            };
        })
    );

    // Calculate total wet weight
    const totalWetWeight = receptionsWithWeights.reduce((sum, r) => sum + r.weight, 0);

    if (totalWetWeight <= 0) {
        return { success: false, message: 'Las recepciones seleccionadas no tienen peso válido' };
    }

    // Create Batch
    const newBatch = await db.insert(cacaoBatches).values({
        batchType,
        startDate: new Date(startDate),
        duration: parseInt(duration),
        totalWetWeight: totalWetWeight.toString(),
        status: 'In progress',
    }).returning();

    const batchId = newBatch[0].id;

    // Link Receptions to Batch
    for (const rec of receptionsWithWeights) {
        // Update reception
        await db.update(receptions)
            .set({ fBatchId: batchId })
            .where(eq(receptions.id, rec.id));

        // Create batch_reception entry with weight
        const percentage = (rec.weight / totalWetWeight) * 100;
        await db.insert(batchReceptions).values({
            batchId,
            receptionId: rec.id,
            wetWeightContribution: rec.weight.toString(),
            percentageOfTotal: percentage.toString(),
        });
    }

    throw redirect(302, '/dashboard/batches');
}, zod$({
    batchType: z.string(),
    startDate: z.string(),
    duration: z.string(),
    receptionIds: z.string(),
}));

export const useUpdateBatchStatus = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const { id, status } = data;

    await db.update(cacaoBatches)
        .set({ status })
        .where(eq(cacaoBatches.id, id));

    throw redirect(302, '/dashboard/batches');
}, zod$({
    id: z.string(),
    status: z.string(),
}));

export default component$(() => {
    const cacaoData = useCacaoData();
    const createBatchAction = useCreateBatch();
    const updateBatchAction = useUpdateBatchStatus();

    const activeTab = useSignal<'available' | 'batches'>('available');
    const selectedReceptions = useSignal<string[]>([]);
    const showCreateDialog = useSignal(false);

    return (
        <div class="space-y-6">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Procesamiento de Cacao</h1>
                <p class="text-gray-500 mt-1">Gestiona los lotes de secado y fermentación</p>
            </div>

            <div class="flex space-x-4 border-b">
                <button
                    class={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab.value === 'available' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick$={() => activeTab.value = 'available'}
                >
                    <div class="flex items-center gap-2">
                        <PackageIcon class="h-4 w-4" />
                        Recepciones Disponibles ({cacaoData.value.availableReceptions.length})
                    </div>
                </button>
                <button
                    class={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab.value === 'batches' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick$={() => activeTab.value = 'batches'}
                >
                    <div class="flex items-center gap-2">
                        <ListIcon class="h-4 w-4" />
                        Lotes Activos ({cacaoData.value.activeBatches.filter(b => b.status === 'In progress').length})
                    </div>
                </button>
            </div>

            {activeTab.value === 'available' && (
                <div class="space-y-4">
                    {selectedReceptions.value.length > 0 && (
                        <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div>
                                <p class="font-medium text-blue-900">
                                    {selectedReceptions.value.length} recepción(es) seleccionada(s)
                                </p>
                            </div>
                            <button
                                onClick$={() => showCreateDialog.value = true}
                                class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                            >
                                Crear Lote
                            </button>
                        </div>
                    )}

                    <div class="bg-white rounded-lg border shadow-sm overflow-hidden">
                        <table class="w-full caption-bottom text-sm">
                            <thead class="[&_tr]:border-b">
                                <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th class="h-12 px-4 text-center align-middle font-medium text-muted-foreground w-[50px]">
                                        <input
                                            type="checkbox"
                                            class="rounded border-gray-300"
                                            onChange$={(e, el) => {
                                                if (el.checked) {
                                                    selectedReceptions.value = cacaoData.value.availableReceptions.map(r => r.id);
                                                } else {
                                                    selectedReceptions.value = [];
                                                }
                                            }}
                                            checked={selectedReceptions.value.length === cacaoData.value.availableReceptions.length && cacaoData.value.availableReceptions.length > 0}
                                        />
                                    </th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Recepción</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Peso (Kg)</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                                </tr>
                            </thead>
                            <tbody class="[&_tr:last-child]:border-0">
                                {cacaoData.value.availableReceptions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} class="p-4 text-center text-muted-foreground">
                                            No hay recepciones disponibles
                                        </td>
                                    </tr>
                                ) : (
                                    cacaoData.value.availableReceptions.map((reception) => (
                                        <tr key={reception.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle text-center">
                                                <input
                                                    type="checkbox"
                                                    class="rounded border-gray-300"
                                                    checked={selectedReceptions.value.includes(reception.id)}
                                                    onChange$={(e, el) => {
                                                        if (el.checked) {
                                                            selectedReceptions.value = [...selectedReceptions.value, reception.id];
                                                        } else {
                                                            selectedReceptions.value = selectedReceptions.value.filter(id => id !== reception.id);
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td class="p-4 align-middle font-medium">{reception.receptionNumber}</td>
                                            <td class="p-4 align-middle">{reception.fruitSubtype}</td>
                                            <td class="p-4 align-middle text-right font-mono">
                                                {Number(reception.totalPesoFinal).toFixed(2)}
                                            </td>
                                            <td class="p-4 align-middle">
                                                {reception.createdAt ? new Date(reception.createdAt).toLocaleDateString('es-DO') : 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab.value === 'batches' && (
                <div class="grid gap-4">
                    {cacaoData.value.activeBatches.length === 0 ? (
                        <div class="text-center py-8 text-muted-foreground">No hay lotes registrados</div>
                    ) : (
                        cacaoData.value.activeBatches.map(batch => (
                            <div key={batch.id} class="bg-white rounded-lg border shadow-sm p-6">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 class="text-lg font-semibold flex items-center gap-2">
                                            {batch.batchType}
                                            <span class={`text-xs px-2 py-1 rounded-full ${batch.status === 'In progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                {batch.status === 'In progress' ? 'En Progreso' : 'Completado'}
                                            </span>
                                        </h3>
                                        <p class="text-sm text-gray-500">ID: {batch.id.slice(0, 8)}...</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm font-medium">Inicio: {new Date(batch.startDate).toLocaleDateString('es-DO')}</p>
                                        <p class="text-sm text-gray-500">Duración: {batch.duration} días</p>
                                    </div>
                                </div>

                                <div class="flex justify-end gap-2 mt-4 pt-4 border-t">
                                    <Link
                                        href={`/dashboard/batches/${batch.id}`}
                                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                    >
                                        Ver Detalles
                                    </Link>
                                    {batch.status === 'In progress' && (
                                        <Form action={updateBatchAction}>
                                            <input type="hidden" name="id" value={batch.id} />
                                            <input type="hidden" name="status" value="Completed" />
                                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                                Marcar como Completado
                                            </button>
                                        </Form>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Create Batch Dialog Modal */}
            {showCreateDialog.value && (
                <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                        <h3 class="text-lg font-semibold mb-4">Crear Nuevo Lote</h3>

                        <Form action={createBatchAction} onSubmitCompleted$={() => {
                            showCreateDialog.value = false;
                            selectedReceptions.value = [];
                        }}>
                            <input type="hidden" name="receptionIds" value={selectedReceptions.value.join(',')} />

                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Tipo de Lote</label>
                                    <select name="batchType" required class="w-full p-2 border rounded-md">
                                        <option value="Drying">Secado</option>
                                        <option value="Fermentation">Fermentación</option>
                                        <option value="Fermentation + Drying">Fermentación + Secado</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium mb-1">Fecha de Inicio</label>
                                    <input type="datetime-local" name="startDate" required defaultValue={new Date().toISOString().slice(0, 16)} class="w-full p-2 border rounded-md" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium mb-1">Duración (días)</label>
                                    <input type="number" name="duration" required min="1" defaultValue="7" class="w-full p-2 border rounded-md" />
                                </div>

                                <div class="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick$={() => showCreateDialog.value = false}
                                        class="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                    >
                                        Crear Lote
                                    </button>
                                </div>
                            </div>
                        </Form>
                    </div>
                </div>
            )}
        </div>
    );
});
