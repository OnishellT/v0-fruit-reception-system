import { component$, useSignal, useTask$, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, server$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashReceptions, cashReceptionDetails, cashCustomers, cashFruitTypes, cashDailyPrices, qualityThresholds } from '~/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { computeCashDiscounts } from '~/lib/utils/discounts';
import { getFruitTypeUuidForCashId } from '~/lib/utils/fruit-mapping';
import { CalculatorIcon, SaveIcon, Loader2Icon, AlertCircleIcon } from 'lucide-qwik';

// Loader for form data
export const useFormData = routeLoader$(async () => {
    const [fruitTypesList, customersList] = await Promise.all([
        db.select({ id: cashFruitTypes.id, name: cashFruitTypes.name, code: cashFruitTypes.code })
            .from(cashFruitTypes)
            .where(eq(cashFruitTypes.enabled, true)),
        db.select({ id: cashCustomers.id, name: cashCustomers.name, nationalId: cashCustomers.nationalId })
            .from(cashCustomers)
            .orderBy(cashCustomers.name),
    ]);

    return { fruitTypes: fruitTypesList, customers: customersList };
});

// Server function to check price
export const checkPrice = server$(async (fruitTypeId: number, date: string) => {
    const price = await db
        .select()
        .from(cashDailyPrices)
        .where(and(
            eq(cashDailyPrices.fruitTypeId, fruitTypeId),
            eq(cashDailyPrices.priceDate, date),
            eq(cashDailyPrices.active, true)
        ))
        .orderBy(desc(cashDailyPrices.createdAt))
        .limit(1);

    if (price.length > 0) {
        return { price: Number(price[0].pricePerKg), exists: true };
    }
    return { price: 0, exists: false };
});

// Server function to calculate discounts
export const calculateDiscounts = server$(async (fruitTypeId: number, weight: number, quality: any) => {
    // Get corresponding regular fruit type UUID
    const fruitTypeUuid = await getFruitTypeUuidForCashId(fruitTypeId);

    if (!fruitTypeUuid) {
        console.warn(`No regular fruit type found for cash fruit type ID: ${fruitTypeId}`);
        return computeCashDiscounts(weight, [], quality);
    }

    // Fetch thresholds from unified table
    const thresholds = await db
        .select()
        .from(qualityThresholds)
        .where(and(
            eq(qualityThresholds.fruitTypeId, fruitTypeUuid),
            eq(qualityThresholds.enabled, true)
        ));

    const formattedThresholds = thresholds.map(t => ({
        fruitTypeId: 0, // Not used by computeCashDiscounts
        metric: t.metric,
        thresholdPercent: Number(t.thresholdPercent),
        enabled: t.enabled
    }));

    const result = computeCashDiscounts(weight, formattedThresholds, quality);
    return result;
});

export const useCreateReception = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const { fruitTypeId, customerId, receptionDate, containersCount, totalWeight, weighingsJson, humedad, moho, violetas } = data;
    const fruitTypeIdInt = parseInt(fruitTypeId);
    const totalWeightNum = parseFloat(totalWeight);

    // Parse weighings
    const weighings = weighingsJson ? JSON.parse(weighingsJson) : [];

    // Re-verify price
    const priceCheck = await db
        .select()
        .from(cashDailyPrices)
        .where(and(
            eq(cashDailyPrices.fruitTypeId, fruitTypeIdInt),
            eq(cashDailyPrices.priceDate, receptionDate),
            eq(cashDailyPrices.active, true)
        ))
        .orderBy(desc(cashDailyPrices.createdAt))
        .limit(1);

    if (priceCheck.length === 0) {
        return { success: false, message: 'No hay precio activo para esta fecha y fruta' };
    }
    const pricePerKg = Number(priceCheck[0].pricePerKg);

    // Calculate discounts
    const quality = {
        humedad: humedad ? parseFloat(humedad) : 0,
        moho: moho ? parseFloat(moho) : 0,
        violetas: violetas ? parseFloat(violetas) : 0,
    };

    // Get corresponding regular fruit type UUID
    const fruitTypeUuid = await getFruitTypeUuidForCashId(fruitTypeIdInt);
    let formattedThresholds: any[] = [];

    if (fruitTypeUuid) {
        const thresholds = await db
            .select()
            .from(qualityThresholds)
            .where(and(
                eq(qualityThresholds.fruitTypeId, fruitTypeUuid),
                eq(qualityThresholds.enabled, true)
            ));

        formattedThresholds = thresholds.map(t => ({
            fruitTypeId: 0,
            metric: t.metric,
            thresholdPercent: Number(t.thresholdPercent),
            enabled: t.enabled
        }));
    }

    const discountResult = computeCashDiscounts(totalWeightNum, formattedThresholds, quality);

    const grossAmount = totalWeightNum * pricePerKg;
    const netAmount = discountResult.finalKg * pricePerKg;

    // Use transaction to save reception and weighing details atomically
    await db.transaction(async (tx) => {
        // Insert reception
        const [reception] = await tx.insert(cashReceptions).values({
            fruitTypeId: fruitTypeIdInt,
            customerId: parseInt(customerId),
            receptionDate: new Date(receptionDate),
            containersCount: parseInt(containersCount),
            totalWeightKgOriginal: totalWeightNum.toString(),
            pricePerKgSnapshot: pricePerKg.toString(),
            calidadHumedad: quality.humedad.toString(),
            calidadMoho: quality.moho.toString(),
            calidadVioletas: quality.violetas.toString(),
            discountPercentTotal: discountResult.combinedPercent.toString(),
            discountWeightKg: discountResult.discountWeightKg.toString(),
            totalWeightKgFinal: discountResult.finalKg.toString(),
            grossAmount: grossAmount.toString(),
            netAmount: netAmount.toString(),
            discountBreakdown: discountResult.breakdown,
            createdBy: session.id,
        }).returning();

        // Insert weighing details if any
        if (weighings.length > 0) {
            await tx.insert(cashReceptionDetails).values(
                weighings.map((w: any) => ({
                    receptionId: reception.id,
                    weighingNumber: w.weighingNumber,
                    containersCount: w.containersCount,
                    weightKg: w.weightKg.toString(),
                }))
            );
        }
    });

    throw redirect(302, '/dashboard/cash-pos/receptions');
}, zod$({
    fruitTypeId: z.string().min(1, "Tipo de fruta requerido"),
    customerId: z.string().min(1, "Cliente requerido"),
    receptionDate: z.string().min(1, "Fecha requerida"),
    containersCount: z.string().min(1, "Cantidad de envases requerida"),
    totalWeight: z.string().min(1, "Peso total requerido"),
    weighingsJson: z.string().optional(),
    humedad: z.string().optional(),
    moho: z.string().optional(),
    violetas: z.string().optional(),
}));

export default component$(() => {
    const formData = useFormData();
    const createAction = useCreateReception();

    // Weighing interface (simplified: just containers + weight)
    interface Weighing {
        weighingNumber: number;
        containersCount: number;
        weightKg: number;
    }

    // Signals
    const fruitTypeId = useSignal('');
    const customerId = useSignal('');
    const receptionDate = useSignal(new Date().toISOString().split('T')[0]);
    const containersCount = useSignal('');
    const weighings = useSignal<Weighing[]>([]);
    const humedad = useSignal('');
    const moho = useSignal('');
    const violetas = useSignal('');

    const priceInfo = useSignal<{ price: number, exists: boolean } | null>(null);
    const calculation = useSignal<any>(null);
    const calculating = useSignal(false);

    // Task to check price
    useTask$(async ({ track }) => {
        track(() => fruitTypeId.value);
        track(() => receptionDate.value);

        if (fruitTypeId.value && receptionDate.value) {
            const result = await checkPrice(parseInt(fruitTypeId.value), receptionDate.value);
            priceInfo.value = result;
        } else {
            priceInfo.value = null;
        }
    });

    const handleCalculate = $(async () => {
        const totalWeight = weighings.value.reduce((sum, w) => sum + w.weightKg, 0);
        if (!fruitTypeId.value || totalWeight === 0) return;

        calculating.value = true;
        try {
            const quality = {
                humedad: humedad.value ? parseFloat(humedad.value) : 0,
                moho: moho.value ? parseFloat(moho.value) : 0,
                violetas: violetas.value ? parseFloat(violetas.value) : 0,
            };

            const result = await calculateDiscounts(parseInt(fruitTypeId.value), totalWeight, quality);

            if (priceInfo.value?.exists) {
                const gross = totalWeight * priceInfo.value.price;
                const net = result.finalKg * priceInfo.value.price;
                const discount = gross - net;

                calculation.value = {
                    ...result,
                    grossAmount: gross,
                    netAmount: net,
                    discountAmount: discount
                };
            }
        } finally {
            calculating.value = false;
        }
    });

    return (
        <div class="container mx-auto p-6 max-w-4xl">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">Nueva Recepción</h1>
                <p class="text-gray-500 mt-2">Crear una nueva recepción de fruta con cálculo automático</p>
            </div>

            <Form action={createAction} class="space-y-6">
                {/* Basic Information */}
                <div class="bg-white rounded-lg border shadow-sm p-6 space-y-4">
                    <h2 class="text-lg font-semibold">Información Básica</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium">Tipo de Fruta *</label>
                            <select
                                name="fruitTypeId"
                                required
                                class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={fruitTypeId.value}
                                onChange$={(e) => fruitTypeId.value = (e.target as HTMLSelectElement).value}
                            >
                                <option value="">Seleccione tipo de fruta</option>
                                {formData.value.fruitTypes.map(f => (
                                    <option key={f.id} value={f.id}>{`${f.name} (${f.code})`}</option>
                                ))}
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Cliente *</label>
                            <select
                                name="customerId"
                                required
                                class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={customerId.value}
                                onChange$={(e) => customerId.value = (e.target as HTMLSelectElement).value}
                            >
                                <option value="">Seleccione cliente</option>
                                {formData.value.customers.map(c => (
                                    <option key={c.id} value={c.id}>{`${c.name} - ${c.nationalId}`}</option>
                                ))}
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Fecha de Recepción *</label>
                            <input
                                type="date"
                                name="receptionDate"
                                required
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={receptionDate.value}
                                onInput$={(e) => receptionDate.value = (e.target as HTMLInputElement).value}
                            />
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Número de Contenedores *</label>
                            <input
                                type="number"
                                name="containersCount"
                                required
                                min="0"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={containersCount.value}
                                onInput$={(e) => containersCount.value = (e.target as HTMLInputElement).value}
                            />
                        </div>
                    </div>

                    {/* Price Info */}
                    {fruitTypeId.value && receptionDate.value && (
                        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div class="flex items-center gap-2">
                                {priceInfo.value?.exists ? (
                                    <>
                                        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                                            Precio Disponible
                                        </span>
                                        <span class="text-sm font-medium">
                                            RD$ {priceInfo.value.price.toFixed(2)} por kg
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircleIcon class="w-4 h-4 text-red-500" />
                                        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80">
                                            Sin Precio
                                        </span>
                                        <span class="text-sm text-gray-500">
                                            Configure un precio para esta fecha y tipo de fruta
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Weighings (Pesadas) */}
                <div class="bg-white rounded-lg border shadow-sm p-6 space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-semibold">Pesadas (Weighings)</h2>
                            {containersCount.value && parseInt(containersCount.value) > 0 && (
                                <div class="flex gap-3 mt-2 text-sm">
                                    <span class="text-gray-600">
                                        Total Envases: <span class="font-semibold">{containersCount.value}</span>
                                    </span>
                                    <span class={`font-semibold ${weighings.value.reduce((sum, w) => sum + w.containersCount, 0) === parseInt(containersCount.value)
                                        ? 'text-green-600'
                                        : weighings.value.reduce((sum, w) => sum + w.containersCount, 0) > parseInt(containersCount.value)
                                            ? 'text-red-600'
                                            : 'text-orange-600'
                                        }`}>
                                        Asignados: {weighings.value.reduce((sum, w) => sum + w.containersCount, 0)}
                                    </span>
                                    <span class={`font-semibold ${parseInt(containersCount.value) - weighings.value.reduce((sum, w) => sum + w.containersCount, 0) === 0
                                        ? 'text-green-600'
                                        : parseInt(containersCount.value) - weighings.value.reduce((sum, w) => sum + w.containersCount, 0) < 0
                                            ? 'text-red-600'
                                            : 'text-orange-600'
                                        }`}>
                                        Restantes: {parseInt(containersCount.value) - weighings.value.reduce((sum, w) => sum + w.containersCount, 0)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick$={() => {
                                weighings.value = [...weighings.value, {
                                    weighingNumber: weighings.value.length + 1,
                                    containersCount: 0,
                                    weightKg: 0,
                                }];
                            }}
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                        >
                            + Agregar Pesada
                        </button>
                    </div>

                    {weighings.value.length > 0 ? (
                        <>
                            <div class="relative w-full overflow-auto">
                                <table class="w-full caption-bottom text-sm">
                                    <thead class="[&_tr]:border-b">
                                        <tr class="border-b transition-colors">
                                            <th class="h-10 px-4 text-left align-middle font-medium">Pesada #</th>
                                            <th class="h-10 px-4 text-right align-middle font-medium">Envases</th>
                                            <th class="h-10 px-4 text-right align-middle font-medium">Peso (kg)</th>
                                            <th class="h-10 px-4 text-center align-middle font-medium">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weighings.value.map((w, idx) => (
                                            <tr key={idx} class="border-b">
                                                <td class="p-4 align-middle font-medium">{w.weighingNumber}</td>
                                                <td class="p-4 align-middle">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        class="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-right"
                                                        value={w.containersCount || ''}
                                                        onInput$={(e) => {
                                                            const val = parseInt((e.target as HTMLInputElement).value) || 0;

                                                            // Check for over-allocation
                                                            if (containersCount.value) {
                                                                const otherTotal = weighings.value
                                                                    .filter((_, i) => i !== idx)
                                                                    .reduce((sum, w) => sum + w.containersCount, 0);
                                                                const maxAllowed = parseInt(containersCount.value) - otherTotal;

                                                                if (val > maxAllowed) {
                                                                    alert(`No se puede asignar ${val} envases. Máximo permitido: ${maxAllowed}`);
                                                                    return;
                                                                }
                                                            }

                                                            weighings.value = weighings.value.map((item, i) =>
                                                                i === idx ? { ...item, containersCount: val } : item
                                                            );
                                                        }}
                                                    />
                                                </td>
                                                <td class="p-4 align-middle">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.001"
                                                        class="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-right font-mono font-bold"
                                                        value={w.weightKg || ''}
                                                        onInput$={(e) => {
                                                            const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                                                            weighings.value = weighings.value.map((item, i) =>
                                                                i === idx ? { ...item, weightKg: val } : item
                                                            );
                                                        }}
                                                    />
                                                </td>
                                                <td class="p-4 align-middle text-center">
                                                    <button
                                                        type="button"
                                                        onClick$={() => {
                                                            weighings.value = weighings.value
                                                                .filter((_, i) => i !== idx)
                                                                .map((w, i) => ({ ...w, weighingNumber: i + 1 }));
                                                        }}
                                                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                    >
                                                        ×
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot class="border-t-2 bg-gray-50">
                                        <tr>
                                            <td class="p-4 align-middle font-semibold">Totales:</td>
                                            <td class="p-4 align-middle text-right font-mono font-bold">
                                                {weighings.value.reduce((sum, w) => sum + w.containersCount, 0)}
                                            </td>
                                            <td class="p-4 align-middle text-right font-mono font-bold text-lg">
                                                {weighings.value.reduce((sum, w) => sum + w.weightKg, 0).toFixed(3)} kg
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {/* Hidden inputs for form submission */}
                            <input type="hidden" name="weighingsJson" value={JSON.stringify(weighings.value)} />
                            <input type="hidden" name="totalWeight" value={weighings.value.reduce((sum, w) => sum + w.weightKg, 0).toString()} />
                            <input type="hidden" name="containersCount" value={weighings.value.reduce((sum, w) => sum + w.containersCount, 0).toString()} />
                        </>
                    ) : (
                        <div class="text-center py-8 text-gray-500">
                            <p>No hay pesadas. Haga clic en "Agregar Pesada" para comenzar.</p>
                        </div>
                    )}
                </div>

                {/* Quality Metrics */}
                <div class="bg-white rounded-lg border shadow-sm p-6 space-y-4">
                    <h2 class="text-lg font-semibold">Métricas de Calidad</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium">Humedad (%)</label>
                            <input
                                type="number"
                                name="humedad"
                                min="0"
                                max="100"
                                step="0.01"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={humedad.value}
                                onInput$={(e) => humedad.value = (e.target as HTMLInputElement).value}
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium">Moho (%)</label>
                            <input
                                type="number"
                                name="moho"
                                min="0"
                                max="100"
                                step="0.01"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={moho.value}
                                onInput$={(e) => moho.value = (e.target as HTMLInputElement).value}
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium">Violetas (%)</label>
                            <input
                                type="number"
                                name="violetas"
                                min="0"
                                max="100"
                                step="0.01"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={violetas.value}
                                onInput$={(e) => violetas.value = (e.target as HTMLInputElement).value}
                            />
                        </div>
                    </div>
                </div>

                {/* Calculation Preview */}
                {calculation.value && (
                    <div class="bg-white rounded-lg border shadow-sm p-6">
                        <div class="flex items-center gap-2 mb-4">
                            <CalculatorIcon class="w-5 h-5" />
                            <h2 class="text-lg font-semibold">Cálculo de Montos</h2>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center">
                                <p class="text-sm text-gray-500">Monto Bruto</p>
                                <p class="text-lg font-semibold">RD$ {calculation.value.grossAmount.toFixed(2)}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-sm text-gray-500">Descuento</p>
                                <p class="text-lg font-semibold text-red-500">-RD$ {calculation.value.discountAmount.toFixed(2)}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-sm text-gray-500">Monto Neto</p>
                                <p class="text-lg font-semibold text-green-600">RD$ {calculation.value.netAmount.toFixed(2)}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-sm text-gray-500">Peso Final</p>
                                <p class="text-lg font-semibold">{calculation.value.finalKg.toFixed(3)} kg</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div class="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick$={() => history.back()}
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick$={handleCalculate}
                        disabled={calculating.value || !priceInfo.value?.exists}
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                    >
                        {calculating.value ? (
                            <>
                                <Loader2Icon class="w-4 h-4 mr-2 animate-spin" />
                                Calculando...
                            </>
                        ) : (
                            <>
                                <CalculatorIcon class="w-4 h-4 mr-2" />
                                Calcular
                            </>
                        )}
                    </button>

                    <button
                        type="submit"
                        disabled={!priceInfo.value?.exists}
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        <SaveIcon class="w-4 h-4 mr-2" />
                        Guardar Recepción
                    </button>
                </div>
            </Form>
        </div>
    );
});
