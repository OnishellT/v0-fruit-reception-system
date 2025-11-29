import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashQualityThresholds, cashFruitTypes } from '~/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { PlusIcon, Trash2Icon } from 'lucide-qwik';

export const useQualityThresholds = routeLoader$(async () => {
    const thresholds = await db
        .select({
            id: cashQualityThresholds.id,
            fruitTypeId: cashQualityThresholds.fruitTypeId,
            fruitTypeName: cashFruitTypes.name,
            metric: cashQualityThresholds.metric,
            thresholdPercent: cashQualityThresholds.thresholdPercent,
            enabled: cashQualityThresholds.enabled,
            createdAt: cashQualityThresholds.createdAt,
        })
        .from(cashQualityThresholds)
        .innerJoin(cashFruitTypes, eq(cashQualityThresholds.fruitTypeId, cashFruitTypes.id))
        .orderBy(cashFruitTypes.name, cashQualityThresholds.metric);

    return thresholds;
});

export const useFruitTypes = routeLoader$(async () => {
    const fruitTypes = await db
        .select()
        .from(cashFruitTypes)
        .where(eq(cashFruitTypes.enabled, true))
        .orderBy(cashFruitTypes.name);

    return fruitTypes;
});

export const useCreateThreshold = routeAction$(async (data) => {
    const { fruitTypeId, metric, thresholdPercent } = data;

    // Check for duplicate
    const existing = await db
        .select()
        .from(cashQualityThresholds)
        .where(
            and(
                eq(cashQualityThresholds.fruitTypeId, fruitTypeId),
                eq(cashQualityThresholds.metric, metric)
            )
        )
        .limit(1);

    if (existing.length > 0) {
        return {
            success: false,
            message: 'Ya existe un umbral para este tipo de fruta y métrica'
        };
    }

    await db.insert(cashQualityThresholds).values({
        fruitTypeId,
        metric,
        thresholdPercent: thresholdPercent.toString(),
        enabled: true,
    });

    return { success: true };
}, zod$({
    fruitTypeId: z.coerce.number(),
    metric: z.string().min(1, 'La métrica es requerida'),
    thresholdPercent: z.coerce.number().min(0).max(100, 'El umbral debe estar entre 0 y 100'),
}));

export const useToggleThreshold = routeAction$(async ({ id, enabled }) => {
    await db
        .update(cashQualityThresholds)
        .set({ enabled: enabled === 'true' })
        .where(eq(cashQualityThresholds.id, parseInt(id)));

    return { success: true };
}, zod$({
    id: z.string(),
    enabled: z.string(),
}));

export const useDeleteThreshold = routeAction$(async ({ id }) => {
    await db
        .delete(cashQualityThresholds)
        .where(eq(cashQualityThresholds.id, parseInt(id)));

    return { success: true };
}, zod$({
    id: z.string(),
}));

export default component$(() => {
    const thresholdsSignal = useQualityThresholds();
    const fruitTypesSignal = useFruitTypes();
    const createAction = useCreateThreshold();
    const toggleAction = useToggleThreshold();
    const deleteAction = useDeleteThreshold();

    const qualityMetrics = [
        { value: 'humedad', label: 'Humedad' },
        { value: 'moho', label: 'Moho' },
        { value: 'violetas', label: 'Violetas' },
    ];

    // Group thresholds by fruit type
    const groupedThresholds = thresholdsSignal.value.reduce((acc, threshold) => {
        const key = threshold.fruitTypeName;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(threshold);
        return acc;
    }, {} as Record<string, typeof thresholdsSignal.value>);

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Umbrales de Calidad</h1>
                    <p class="text-gray-500 mt-1">Configurar estándares de calidad para descuentos automáticos</p>
                </div>
            </div>

            {/* Create Threshold Form */}
            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <h3 class="font-semibold mb-4 flex items-center gap-2">
                        <PlusIcon class="h-5 w-5" />
                        Agregar Nuevo Umbral
                    </h3>
                    <Form action={createAction} class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium">Tipo de Fruta *</label>
                            <select
                                name="fruitTypeId"
                                required
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">Seleccionar...</option>
                                {fruitTypesSignal.value.map((ft) => (
                                    <option key={ft.id} value={ft.id}>{ft.name}</option>
                                ))}
                            </select>
                            {createAction.value?.fieldErrors?.fruitTypeId && (
                                <p class="text-sm text-red-500">{createAction.value.fieldErrors.fruitTypeId}</p>
                            )}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Métrica *</label>
                            <select
                                name="metric"
                                required
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">Seleccionar...</option>
                                {qualityMetrics.map((metric) => (
                                    <option key={metric.value} value={metric.value}>{metric.label}</option>
                                ))}
                            </select>
                            {createAction.value?.fieldErrors?.metric && (
                                <p class="text-sm text-red-500">{createAction.value.fieldErrors.metric}</p>
                            )}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Umbral (%) *</label>
                            <input
                                type="number"
                                name="thresholdPercent"
                                required
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="0.00"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            {createAction.value?.fieldErrors?.thresholdPercent && (
                                <p class="text-sm text-red-500">{createAction.value.fieldErrors.thresholdPercent}</p>
                            )}
                        </div>

                        <div class="flex items-end">
                            <button
                                type="submit"
                                class="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                Agregar Umbral
                            </button>
                        </div>
                    </Form>

                    {createAction.value?.failed && (
                        <div class="mt-4 p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                            <span class="font-medium">Error:</span> {createAction.value.message}
                        </div>
                    )}
                    {createAction.value?.success && (
                        <div class="mt-4 p-4 text-sm text-green-800 rounded-lg bg-green-50" role="alert">
                            <span class="font-medium">Éxito:</span> Umbral agregado correctamente
                        </div>
                    )}
                </div>
            </div>

            {/* Thresholds List - Grouped by Fruit Type */}
            <div class="space-y-4">
                {Object.keys(groupedThresholds).length === 0 ? (
                    <div class="bg-white rounded-lg border shadow-sm p-6 text-center text-muted-foreground">
                        No hay umbrales de calidad configurados
                    </div>
                ) : (
                    Object.entries(groupedThresholds).map(([fruitTypeName, thresholds]) => (
                        <div key={fruitTypeName} class="bg-white rounded-lg border shadow-sm">
                            <div class="p-6">
                                <h3 class="font-semibold mb-4">{fruitTypeName}</h3>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {thresholds.map((threshold) => (
                                        <div key={threshold.id} class="border rounded-lg p-4">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="text-sm font-medium text-gray-500">
                                                    {qualityMetrics.find(m => m.value === threshold.metric)?.label || threshold.metric}
                                                </span>
                                                <Form action={deleteAction}>
                                                    <input type="hidden" name="id" value={threshold.id} />
                                                    <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-red-100 hover:text-red-600 h-8 w-8">
                                                        <Trash2Icon class="h-4 w-4" />
                                                    </button>
                                                </Form>
                                            </div>
                                            <div class="text-2xl font-bold text-primary mb-2">
                                                {Number(threshold.thresholdPercent).toFixed(2)}%
                                            </div>
                                            <Form action={toggleAction}>
                                                <input type="hidden" name="id" value={threshold.id} />
                                                <input type="hidden" name="enabled" value={(!threshold.enabled).toString()} />
                                                <button type="submit" class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${threshold.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {threshold.enabled ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </Form>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
});
