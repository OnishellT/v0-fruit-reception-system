import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, zod$, z, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { laboratorySamples } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateLabSample } from '~/lib/actions/lab/samples';
import { recalculateReceptionWeights } from '~/lib/actions/receptions/calculate-weights';
import { ArrowLeftIcon, SaveIcon } from 'lucide-qwik';

export const useLabSample = routeLoader$(async ({ params, status }) => {
    const sample = await db.query.laboratorySamples.findFirst({
        where: eq(laboratorySamples.id, params.id),
        with: {
            reception: {
                with: {
                    provider: true,
                    fruitType: true,
                }
            }
        }
    });

    if (!sample) {
        status(404);
        return null;
    }
    return sample;
});

export const useUpdateSample = routeAction$(async (data, { params, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) return { success: false, error: 'No autorizado' };

    const result = await updateLabSample({
        id: params.id,
        status: data.status as 'Drying' | 'Analysis' | 'Completed',
        driedSampleKg: data.driedSampleKg ? Number(data.driedSampleKg) : undefined,
        violetasPercentage: data.violetasPercentage ? Number(data.violetasPercentage) : undefined,
        mohoPercentage: data.mohoPercentage ? Number(data.mohoPercentage) : undefined,
        basuraPercentage: data.basuraPercentage ? Number(data.basuraPercentage) : undefined,
    }, session.id);

    if (result.success) {
        // Fetch sample to get receptionId
        const sample = await db.query.laboratorySamples.findFirst({
            where: eq(laboratorySamples.id, params.id),
            columns: { receptionId: true }
        });

        if (sample && sample.receptionId) {
            await recalculateReceptionWeights(sample.receptionId);
        }
    }

    return result;
}, zod$({
    status: z.enum(['Drying', 'Analysis', 'Completed']),
    driedSampleKg: z.string().optional(),
    violetasPercentage: z.string().optional(),
    mohoPercentage: z.string().optional(),
    basuraPercentage: z.string().optional(),
}));

export default component$(() => {
    const sampleSignal = useLabSample();
    const updateAction = useUpdateSample();

    if (!sampleSignal.value) {
        return <div>Muestra no encontrada</div>;
    }

    const sample = sampleSignal.value;

    return (
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <Link href="/dashboard/lab">
                    <button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                        <ArrowLeftIcon class="h-4 w-4 mr-2" />
                        Volver
                    </button>
                </Link>
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Detalle de Muestra</h1>
                    <p class="text-gray-600 mt-1">ID: {sample.id}</p>
                </div>
            </div>

            <div class="grid gap-6 md:grid-cols-2">
                {/* Info Card */}
                <div class="bg-white rounded-lg border shadow-sm p-6 space-y-4">
                    <h3 class="font-semibold text-lg border-b pb-2">Información de Recepción</h3>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500 block">Recepción</span>
                            <span class="font-medium">{sample.reception?.receptionNumber}</span>
                        </div>
                        <div>
                            <span class="text-gray-500 block">Proveedor</span>
                            <span class="font-medium">{sample.reception?.provider?.name}</span>
                        </div>
                        <div>
                            <span class="text-gray-500 block">Tipo de Fruto</span>
                            <span class="font-medium">{sample.reception?.fruitType?.type} - {sample.reception?.fruitType?.subtype}</span>
                        </div>
                        <div>
                            <span class="text-gray-500 block">Peso Muestra Húmeda</span>
                            <span class="font-medium">{sample.sampleWeight} kg</span>
                        </div>
                    </div>
                </div>

                {/* Analysis Form */}
                <div class="bg-white rounded-lg border shadow-sm p-6">
                    <h3 class="font-semibold text-lg border-b pb-4 mb-4">Análisis de Laboratorio</h3>

                    <Form action={updateAction} class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium">Estado</label>
                            <select name="status" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="Drying" selected={sample.status === 'Drying'}>En Secado</option>
                                <option value="Analysis" selected={sample.status === 'Analysis'}>En Análisis</option>
                                <option value="Completed" selected={sample.status === 'Completed'}>Completado</option>
                            </select>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-sm font-medium">Peso Seco (kg)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="driedSampleKg"
                                    defaultValue={sample.driedSampleKg?.toString()}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <div class="space-y-2">
                                <label class="text-sm font-medium">Basura (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="basuraPercentage"
                                    defaultValue={sample.basuraPercentage?.toString()}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-sm font-medium">Moho (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="mohoPercentage"
                                    defaultValue={sample.mohoPercentage?.toString()}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <div class="space-y-2">
                                <label class="text-sm font-medium">Violetas (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="violetasPercentage"
                                    defaultValue={sample.violetasPercentage?.toString()}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div class="pt-4 flex justify-end">
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2">
                                <SaveIcon class="w-4 h-4 mr-2" />
                                Guardar Resultados
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
