import { component$, useSignal } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { receptions, providers, drivers, receptionDetails, fruitTypes, qualityEvaluations, laboratorySamples, desgloseDescuentos, calidadCafe as calidades } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ArrowLeftIcon, TrendingDownIcon, FlaskConicalIcon, PrinterIcon } from 'lucide-qwik';
import { createLabSample } from '~/lib/actions/lab/samples';
// import type { generateReceptionReceipt } from '~/lib/pdf-generator';

export const useReceptionDetails = routeLoader$(async ({ params }) => {
    const receptionId = params.id;

    const [reception] = await db.select({
        id: receptions.id,
        receptionNumber: receptions.receptionNumber,
        receptionDate: receptions.receptionDate,
        receptionTime: receptions.receptionTime,
        status: receptions.status,
        notes: receptions.notes,
        truckPlate: receptions.truckPlate,
        totalContainers: receptions.totalContainers,
        totalPesoOriginal: receptions.totalPesoOriginal,
        totalPesoDescuento: receptions.totalPesoDescuento,
        totalPesoFinal: receptions.totalPesoFinal,
        labSampleWetWeight: receptions.labSampleWetWeight,
        labSampleDriedWeight: receptions.labSampleDriedWeight,
        totalPesoDried: receptions.totalPesoDried,
        providerName: providers.name,
        driverName: drivers.name,
        fruitType: fruitTypes.type,
        fruitSubtype: fruitTypes.subtype,
        createdAt: receptions.createdAt,
    })
        .from(receptions)
        .leftJoin(providers, eq(receptions.providerId, providers.id))
        .leftJoin(drivers, eq(receptions.driverId, drivers.id))
        .leftJoin(fruitTypes, eq(receptions.fruitTypeId, fruitTypes.id))
        .where(eq(receptions.id, receptionId))
        .limit(1);

    if (!reception) return null;

    const details = await db.select({
        id: receptionDetails.id,
        lineNumber: receptionDetails.lineNumber,
        quantity: receptionDetails.quantity,
        weightKg: receptionDetails.weightKg,
        fruitType: fruitTypes.type,
        fruitSubtype: fruitTypes.subtype,
    })
        .from(receptionDetails)
        .leftJoin(fruitTypes, eq(receptionDetails.fruitTypeId, fruitTypes.id))
        .where(eq(receptionDetails.receptionId, receptionId))
        .orderBy(receptionDetails.lineNumber);

    const quality = await db.select()
        .from(calidades)
        .where(eq(calidades.recepcionId, receptionId))
        .limit(1)
        .then(results => results[0]);

    const labSample = await db.query.laboratorySamples.findFirst({
        where: eq(laboratorySamples.receptionId, receptionId),
    });

    // Fetch discount breakdown
    const discountBreakdown = await db.select()
        .from(desgloseDescuentos)
        .where(eq(desgloseDescuentos.recepcionId, receptionId))
        .orderBy(desgloseDescuentos.createdAt);

    return { reception, details, quality, labSample, discountBreakdown };
});

export const useUpdateQuality = routeAction$(async (data, { params, cookie, fail }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session || !session.id) {
        return fail(401, { message: 'Unauthorized' });
    }
    const userId = session.id;
    const receptionId = params.id;

    // Check if exists
    const existing = await db.query.qualityEvaluations.findFirst({
        where: eq(qualityEvaluations.recepcionId, receptionId),
    });

    if (existing) {
        await db.update(qualityEvaluations)
            .set({
                violetas: data.violetas.toString(),
                humedad: data.humedad.toString(),
                moho: data.moho.toString(),
                updatedBy: userId,
                updatedAt: new Date(),
            })
            .where(eq(qualityEvaluations.id, existing.id));
    } else {
        await db.insert(qualityEvaluations).values({
            recepcionId: receptionId,
            violetas: data.violetas.toString(),
            humedad: data.humedad.toString(),
            moho: data.moho.toString(),
            createdBy: userId,
            updatedBy: userId,
        });
    }

    return { success: true };
}, zod$({
    violetas: z.coerce.number(),
    humedad: z.coerce.number(),
    moho: z.coerce.number(),
}));

export const useCreateLabSample = routeAction$(async (data, { params, cookie, fail }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session || !session.id) {
        return fail(401, { message: 'Unauthorized' });
    }
    const userId = session.id;
    const receptionId = params.id;
    await createLabSample({
        receptionId,
        sampleWeight: data.sampleWeight,
        estimatedDryingDays: data.estimatedDryingDays,
    }, userId);
    return { success: true };
}, zod$({
    sampleWeight: z.coerce.number(),
    estimatedDryingDays: z.coerce.number(),
}));

export default component$(() => {
    const detailsSignal = useReceptionDetails();
    const updateQualityAction = useUpdateQuality();
    const createLabSampleAction = useCreateLabSample();
    const showQualityModal = useSignal(false);
    const showLabModal = useSignal(false);



    if (!detailsSignal.value) {
        return <div class="p-6 text-red-600">Recepción no encontrada</div>;
    }

    const { reception, details, quality, labSample, discountBreakdown } = detailsSignal.value;

    return (
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <Link href="/dashboard/reception" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    <ArrowLeftIcon class="h-4 w-4 mr-2" />
                    Volver
                </Link>
                <div class="flex-1">
                    <h1 class="text-3xl font-bold text-gray-900">{reception.receptionNumber}</h1>
                    <p class="text-gray-600 mt-1">Detalle de la recepción</p>
                </div>
                <div class="flex gap-2">
                    <Link
                        href={`/dashboard/reception/${reception.id}/print`}
                        target="_blank"
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                        <PrinterIcon class="h-4 w-4 mr-2" />
                        Imprimir
                    </Link>
                    <Link
                        href={`/dashboard/reception/${reception.id}/edit`}
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                        Editar
                    </Link>
                </div>
            </div>

            <div class="grid gap-6 md:grid-cols-2">
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="p-6 space-y-3">
                        <h3 class="font-semibold leading-none tracking-tight">Información General</h3>
                        <div class="grid grid-cols-2 gap-4 pt-4">
                            <div>
                                <p class="text-sm text-gray-500">Fecha</p>
                                <p class="font-medium">{new Date(reception.receptionDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Proveedor</p>
                                <p class="font-medium">{reception.providerName}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Chofer</p>
                                <p class="font-medium">{reception.driverName}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Placa</p>
                                <p class="font-medium">{reception.truckPlate}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Tipo de Fruto</p>
                                <p class="font-medium">{reception.fruitType} - {reception.fruitSubtype}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Estado</p>
                                <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${reception.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {reception.status === 'completed' ? 'Completada' : 'Pendiente'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="p-6 space-y-3">
                        <h3 class="font-semibold leading-none tracking-tight">Resumen</h3>
                        <div class="space-y-4 pt-4">
                            <div class="flex justify-between">
                                <span class="text-gray-500">Total Contenedores</span>
                                <span class="font-bold text-xl">{reception.totalContainers}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Peso Original (Húmedo)</span>
                                <span class="font-bold text-xl">{Number(reception.totalPesoOriginal || 0).toFixed(2)} kg</span>
                            </div>

                            {/* Cacao Verde Specific Fields */}
                            {/* Cacao Verde Specific Fields */}
                            {(reception.fruitType?.toUpperCase()?.includes('CACAO') && reception.fruitSubtype?.toUpperCase()?.includes('VERDE')) && (() => {
                                // Calculate values for display
                                const qualityDiscount = discountBreakdown?.reduce((sum, d) => sum + Number(d.pesoDescuento || 0), 0) || 0;
                                const totalDeduction = Number(reception.totalPesoDescuento || 0);
                                const labAdjustment = totalDeduction - qualityDiscount;

                                return (
                                    <>
                                        {Number(reception.totalPesoDried || 0) > 0 && (
                                            <div class="flex justify-between">
                                                <span class="text-orange-600">Peso Seco (Después de Lote)</span>
                                                <span class="font-bold text-xl text-orange-600">{Number(reception.totalPesoDried).toFixed(2)} kg</span>
                                            </div>
                                        )}

                                        <div class="flex justify-between">
                                            <div class="flex flex-col">
                                                <span class="text-blue-600">Ajuste por Muestras de Lab</span>
                                                <span class="text-xs text-gray-400">
                                                    Húmedo: {Number(reception.labSampleWetWeight || 0).toFixed(2)} kg
                                                    {Number(reception.labSampleDriedWeight || 0) > 0 && `, Seco: ${Number(reception.labSampleDriedWeight).toFixed(2)} kg`}
                                                </span>
                                            </div>
                                            <span class="font-bold text-xl text-blue-600">
                                                -{Math.max(0, labAdjustment).toFixed(2)} kg
                                            </span>
                                        </div>

                                        {qualityDiscount > 0 && (
                                            <div class="flex justify-between">
                                                <span class="text-red-600">Desc. Calidad</span>
                                                <span class="font-bold text-xl text-red-600">-{qualityDiscount.toFixed(2)} kg</span>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            {/* Fallback for non-Cacao Verde or standard discount display if needed */}
                            {/* We hide the standard discount row if we showed the specific Cacao Verde one above to avoid duplication */}
                            {!(reception.fruitType?.toUpperCase()?.includes('CACAO') && reception.fruitSubtype?.toUpperCase()?.includes('VERDE')) && Number(reception.totalPesoDescuento || 0) > 0 && (
                                <div class="flex justify-between">
                                    <span class="text-red-600">Desc. Calidad</span>
                                    <span class="font-bold text-xl text-red-600">-{Number(reception.totalPesoDescuento).toFixed(2)} kg</span>
                                </div>
                            )}

                            <div class="flex justify-between border-t pt-2">
                                <span class="text-green-600 font-medium">Peso Final</span>
                                <span class="font-bold text-2xl text-green-600">{Number(reception.totalPesoFinal || reception.totalPesoOriginal || 0).toFixed(2)} kg</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Table */}
            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div class="p-6">
                    <h3 class="font-semibold mb-4">Detalles de Pesada</h3>
                    <div class="relative w-full overflow-auto">
                        <table class="w-full caption-bottom text-sm">
                            <thead class="[&_tr]:border-b">
                                <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">#</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Cantidad</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Peso (kg)</th>
                                </tr>
                            </thead>
                            <tbody class="[&_tr:last-child]:border-0">
                                {details.map((d) => (
                                    <tr key={d.id} class="border-b transition-colors hover:bg-muted/50">
                                        <td class="p-4 align-middle">{d.lineNumber}</td>
                                        <td class="p-4 align-middle">{d.fruitType} - {d.fruitSubtype}</td>
                                        <td class="p-4 align-middle text-right">{d.quantity}</td>
                                        <td class="p-4 align-middle text-right">{Number(d.weightKg).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>


            {/* Discount Breakdown Table */}
            {discountBreakdown && discountBreakdown.length > 0 && (
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="p-6">
                        <h3 class="font-semibold mb-4">Desglose de Descuentos</h3>
                        <div class="relative w-full overflow-auto">
                            <table class="w-full caption-bottom text-sm">
                                <thead class="[&_tr]:border-b">
                                    <tr class="border-b transition-colors hover:bg-muted/50">
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Parámetro</th>
                                        <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Umbral (%)</th>
                                        <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Valor (%)</th>
                                        <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Descuento (%)</th>
                                        <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Peso Desc. (kg)</th>
                                    </tr>
                                </thead>
                                <tbody class="[&_tr:last-child]:border-0">
                                    {discountBreakdown.map((breakdown) => (
                                        <tr key={breakdown.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle font-medium">{breakdown.parametro}</td>
                                            <td class="p-4 align-middle text-right font-mono">{Number(breakdown.umbral).toFixed(2)}%</td>
                                            <td class="p-4 align-middle text-right font-mono">{Number(breakdown.valor).toFixed(2)}%</td>
                                            <td class="p-4 align-middle text-right font-mono text-red-600">{Number(breakdown.porcentajeDescuento).toFixed(2)}%</td>
                                            <td class="p-4 align-middle text-right font-mono font-bold text-red-600">-{Number(breakdown.pesoDescuento).toFixed(2)} kg</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot class="border-t-2 bg-gray-50">
                                    <tr>
                                        <td colSpan={4} class="p-4 align-middle font-semibold">Total Descuento:</td>
                                        <td class="p-4 align-middle text-right font-mono font-bold text-red-600 text-lg">
                                            -{Number(reception.totalPesoDescuento || 0).toFixed(2)} kg
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Lab Sample Weight Info */}
                        {reception.labSampleWetWeight && (
                            <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h4 class="font-semibold text-blue-900 mb-2">📊 Muestra de Laboratorio</h4>
                                <div class="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span class="text-blue-700">Peso Húmedo Muestra:</span>
                                        <span class="font-mono font-bold ml-2">{Number(reception.labSampleWetWeight).toFixed(2)} kg</span>
                                    </div>
                                    {reception.labSampleDriedWeight && (
                                        <div>
                                            <span class="text-blue-700">Peso Seco Muestra:</span>
                                            <span class="font-mono font-bold ml-2">{Number(reception.labSampleDriedWeight).toFixed(2)} kg</span>
                                        </div>
                                    )}
                                </div>
                                <p class="text-xs text-blue-600 mt-2">
                                    ℹ️ El peso de la muestra de laboratorio se descuenta inicialmente del peso total.
                                    Una vez que los resultados del laboratorio están listos, el peso seco se vuelve a agregar al peso final.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div class="grid gap-6 md:grid-cols-2">
                {/* Quality Evaluation Section */}
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-semibold flex items-center gap-2">
                                <TrendingDownIcon class="h-5 w-5 text-green-600" />
                                Evaluación de Calidad
                            </h3>
                            <button
                                onClick$={() => showQualityModal.value = true}
                                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                            >
                                {quality ? 'Editar Calidad' : 'Registrar Calidad'}
                            </button>
                        </div>

                        {quality ? (
                            <div class="grid grid-cols-3 gap-4">
                                <div class="p-4 bg-gray-50 rounded-lg text-center">
                                    <p class="text-sm text-gray-500">Violetas</p>
                                    <p class="text-xl font-bold">{Number(quality.violetas).toFixed(2)}%</p>
                                </div>
                                <div class="p-4 bg-gray-50 rounded-lg text-center">
                                    <p class="text-sm text-gray-500">Humedad</p>
                                    <p class="text-xl font-bold">{Number(quality.humedad).toFixed(2)}%</p>
                                </div>
                                <div class="p-4 bg-gray-50 rounded-lg text-center">
                                    <p class="text-sm text-gray-500">Moho</p>
                                    <p class="text-xl font-bold">{Number(quality.moho).toFixed(2)}%</p>
                                </div>
                            </div>
                        ) : (
                            <p class="text-gray-500 text-center py-4">No se ha registrado evaluación de calidad</p>
                        )}
                    </div>
                </div>

                {/* Laboratory Sample Section */}
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-semibold flex items-center gap-2">
                                <FlaskConicalIcon class="h-5 w-5 text-blue-600" />
                                Muestra de Laboratorio
                            </h3>
                            {!labSample && (
                                <button
                                    onClick$={() => showLabModal.value = true}
                                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-9 px-3"
                                >
                                    Crear Muestra
                                </button>
                            )}
                        </div>

                        {labSample ? (
                            <div class="space-y-4">
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-sm text-gray-500">Estado</p>
                                        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${labSample.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                labSample.status === 'Analysis' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'}`}>
                                            {labSample.status === 'Drying' ? 'En Secado' :
                                                labSample.status === 'Analysis' ? 'En Análisis' : 'Completado'}
                                        </span>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">Peso Muestra</p>
                                        <p class="font-medium">{labSample.sampleWeight} kg</p>
                                    </div>
                                </div>
                                <div class="pt-2 border-t">
                                    <Link href={`/dashboard/lab/samples/${labSample.id}`} class="text-sm text-blue-600 hover:underline">
                                        Ver detalles de análisis &rarr;
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <p class="text-gray-500 text-center py-4">No hay muestra de laboratorio activa</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quality Modal */}
            {showQualityModal.value && (
                <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h3 class="text-lg font-bold mb-4">Evaluación de Calidad</h3>
                        <Form action={updateQualityAction} onSubmitCompleted$={() => showQualityModal.value = false}>
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Violetas (%)</label>
                                    <input
                                        type="number"
                                        name="violetas"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        value={quality?.violetas || ''}
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Humedad (%)</label>
                                    <input
                                        type="number"
                                        name="humedad"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        value={quality?.humedad || ''}
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Moho (%)</label>
                                    <input
                                        type="number"
                                        name="moho"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        value={quality?.moho || ''}
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div class="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick$={() => showQualityModal.value = false}
                                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2"
                                >
                                    Guardar
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}

            {/* Lab Sample Modal */}
            {showLabModal.value && (
                <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h3 class="text-lg font-bold mb-4">Crear Muestra de Laboratorio</h3>
                        <Form action={createLabSampleAction} onSubmitCompleted$={() => showLabModal.value = false}>
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Peso de Muestra (kg)</label>
                                    <input
                                        type="number"
                                        name="sampleWeight"
                                        step="0.01"
                                        min="0.1"
                                        required
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Días Estimados de Secado</label>
                                    <input
                                        type="number"
                                        name="estimatedDryingDays"
                                        min="1"
                                        required
                                        defaultValue="5"
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div class="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick$={() => showLabModal.value = false}
                                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
                                >
                                    Crear Muestra
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}
        </div>
    );
});
