import { component$, useSignal, $, useTask$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$, server$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { providers, drivers, fruitTypes, receptions, receptionDetails, auditLogs, qualityThresholds, desgloseDescuentos, qualityEvaluations } from '~/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { PlusIcon, Trash2Icon } from 'lucide-qwik';
import { PricingPreview } from '../../../../components/pricing/pricing-preview';
import { getLatestDailyPrice } from '~/lib/actions/pricing/daily-prices';
import { computeCashDiscounts } from '~/lib/utils/discounts';

// Loaders for form data
export const useFormData = routeLoader$(async () => {
    const [providersList, driversList, fruitTypesList] = await Promise.all([
        db.select({ id: providers.id, name: providers.name }).from(providers).where(eq(providers.isActive, true)),
        db.select({ id: drivers.id, name: drivers.name }).from(drivers).where(eq(drivers.isActive, true)),
        db.select({ id: fruitTypes.id, type: fruitTypes.type, subtype: fruitTypes.subtype }).from(fruitTypes).where(eq(fruitTypes.isActive, true)),
    ]);

    return { providers: providersList, drivers: driversList, fruitTypes: fruitTypesList };
});

// Server function to get latest price
export const getLatestPrice = server$(async (fruitTypeId: string) => {
    const price = await getLatestDailyPrice(fruitTypeId);
    return price ? price.pricePerKg : 0;
});

// Action to create reception
export const useCreateReception = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const { providerId, driverId, fruitTypeId, truckPlate, totalContainers, notes, details, humedad, moho, violetas } = data;
    const parsedDetails = JSON.parse(details as string);

    // Calculate total weight from pesadas
    const totalWeightKg = parsedDetails.reduce((sum: number, d: any) => sum + Number(d.weightKg), 0);

    // Parse quality metrics (if provided)
    const quality = {
        humedad: humedad ? parseFloat(humedad) : undefined,
        moho: moho ? parseFloat(moho) : undefined,
        violetas: violetas ? parseFloat(violetas) : undefined,
    };

    // Fetch quality thresholds for the fruit type (using unified table)
    const thresholds = await db
        .select()
        .from(qualityThresholds)
        .where(and(
            eq(qualityThresholds.fruitTypeId, fruitTypeId),
            eq(qualityThresholds.enabled, true)
        ));

    const formattedThresholds = thresholds.map(t => ({
        fruitTypeId: 0, // Not used by computeCashDiscounts
        metric: t.metric,
        thresholdPercent: Number(t.thresholdPercent),
        enabled: t.enabled
    }));

    // Calculate discounts (will be 0% with empty thresholds)
    const discountResult = computeCashDiscounts(totalWeightKg, formattedThresholds, quality);

    // Generate reception number (simplified for now)
    const receptionNumber = `REC-${Date.now()}`;

    // Calculate final weight explicitly to ensure consistency with DB constraint
    // Constraint: total_peso_final = total_peso_original - total_peso_descuento
    const discountWeight = discountResult.discountWeightKg;
    const finalWeight = totalWeightKg - discountWeight;

    const [newReception] = await db.insert(receptions).values({
        receptionNumber,
        providerId,
        driverId,
        fruitTypeId,
        truckPlate,
        totalContainers: Number(totalContainers),
        totalPesoOriginal: totalWeightKg.toString(),
        totalPesoDescuento: discountWeight.toString(),
        totalPesoFinal: finalWeight.toString(),
        notes,
        createdBy: session.id,
        status: 'completed',
    }).returning();

    // Save discount breakdown if any discounts were applied
    if (discountResult.breakdown.length > 0) {
        await db.insert(desgloseDescuentos).values(
            discountResult.breakdown.map(b => ({
                recepcionId: newReception.id,
                parametro: b.parametro,
                umbral: b.umbral.toString(),
                valor: b.valor.toString(),
                porcentajeDescuento: b.porcentajeDescuento.toString(),
                pesoDescuento: b.pesoDescuento.toString(),
                createdBy: session.id,
            }))
        );
    }

    // Save quality evaluations if provided
    if (quality.humedad !== undefined || quality.moho !== undefined || quality.violetas !== undefined) {
        await db.insert(qualityEvaluations).values({
            recepcionId: newReception.id,
            humedad: quality.humedad?.toString(),
            moho: quality.moho?.toString(),
            violetas: quality.violetas?.toString(),
            createdBy: session.id,
            updatedBy: session.id,
        });
    }

    // Insert details
    if (parsedDetails.length > 0) {
        await db.insert(receptionDetails).values(
            parsedDetails.map((d: any, index: number) => ({
                receptionId: newReception.id,
                fruitTypeId: d.fruitTypeId,
                quantity: Number(d.quantity),
                weightKg: d.weightKg.toString(),
                lineNumber: index + 1,
            }))
        );
    }

    // Audit log
    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'create',
        tableName: 'receptions',
        recordId: newReception.id,
        // details: JSON.stringify({ receptionNumber }),
    });

    throw redirect(302, '/dashboard/reception');
}, zod$({
    providerId: z.string(),
    driverId: z.string(),
    fruitTypeId: z.string(),
    truckPlate: z.string(),
    totalContainers: z.string(), // Form sends strings
    notes: z.string().optional(),
    humedad: z.string().optional(),
    moho: z.string().optional(),
    violetas: z.string().optional(),
    details: z.string(), // JSON string of details
}));

export default component$(() => {
    const formData = useFormData();
    const createAction = useCreateReception();

    // Local state for details
    const details = useSignal<any[]>([]);
    const currentDetail = useSignal({ quantity: 0, weightKg: 0 });
    const selectedFruitType = useSignal('');
    const basePrice = useSignal(0);
    const totalContainers = useSignal('');

    // Quality estimation state
    const qualityMetrics = useSignal<{ metric: string; value: number }[]>([
        { metric: 'Humedad', value: 0 },
        { metric: 'Moho', value: 0 },
        { metric: 'Violetas', value: 0 },
    ]);

    // Fetch price when fruit type changes
    useTask$(({ track }) => {
        track(() => selectedFruitType.value);
        if (selectedFruitType.value) {
            getLatestPrice(selectedFruitType.value).then(price => {
                basePrice.value = price;
            });
        } else {
            basePrice.value = 0;
        }
    });

    const addDetail = $(() => {
        if (currentDetail.value.quantity < 0 || currentDetail.value.weightKg < 0) return;

        // Check for over-allocation
        if (totalContainers.value) {
            const currentTotal = details.value.reduce((sum, d) => sum + d.quantity, 0);
            const newTotal = currentTotal + currentDetail.value.quantity;
            if (newTotal > parseInt(totalContainers.value)) {
                alert(`No se puede agregar: excedería el total de contenedores (${totalContainers.value}). Restantes: ${parseInt(totalContainers.value) - currentTotal}`);
                return;
            }
        }

        details.value = [
            ...details.value,
            {
                fruitTypeId: selectedFruitType.value,
                quantity: currentDetail.value.quantity,
                weightKg: currentDetail.value.weightKg
            }
        ];

        // Reset current detail
        currentDetail.value = { quantity: 0, weightKg: 0 };
    });

    const removeDetail = $((index: number) => {
        details.value = details.value.filter((_, i) => i !== index);
    });

    // Calculate total weight for preview
    const totalWeight = details.value.reduce((sum, d) => sum + d.weightKg, 0);

    // Get fruit type name for preview
    const selectedFruitTypeName = formData.value.fruitTypes.find(f => f.id === selectedFruitType.value)?.type || '';

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Nueva Recepción</h2>
                    <p class="text-sm text-gray-500 mt-1">Registre una nueva pesada de frutos</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                    <Form action={createAction} class="space-y-6">
                        <input type="hidden" name="details" value={JSON.stringify(details.value)} />

                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="providerId">Proveedor *</label>
                                <select name="providerId" required class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                    <option value="">Seleccione proveedor</option>
                                    {formData.value.providers.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="driverId">Chofer *</label>
                                <select name="driverId" required class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                    <option value="">Seleccione chofer</option>
                                    {formData.value.drivers.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="fruitTypeId">Tipo de Fruto *</label>
                                <select
                                    name="fruitTypeId"
                                    required
                                    class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    onChange$={(e) => selectedFruitType.value = (e.target as HTMLSelectElement).value}
                                >
                                    <option value="">Seleccione tipo de fruto</option>
                                    {formData.value.fruitTypes.map(f => (
                                        <option key={f.id} value={f.id}>{`${f.type} - ${f.subtype}`}</option>
                                    ))}
                                </select>
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="truckPlate">Placa del Camión *</label>
                                <input type="text" name="truckPlate" required placeholder="Ej: ABC-123" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="totalContainers">Total Contenedores/Sacos *</label>
                                <input
                                    type="number"
                                    name="totalContainers"
                                    required
                                    min="1"
                                    placeholder="Ej: 25"
                                    value={totalContainers.value}
                                    onInput$={(e) => totalContainers.value = (e.target as HTMLInputElement).value}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="notes">Notas</label>
                            <textarea name="notes" rows={3} placeholder="Observaciones adicionales..." class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></textarea>
                        </div>

                        {/* Quality Metrics (Optional) */}
                        <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                            <h3 class="font-semibold mb-4">Estimación de Calidad (Opcional)</h3>
                            <p class="text-sm text-gray-500 mb-4">Los descuentos se calcularán automáticamente basados en estos valores.</p>
                            <div class="grid gap-4 md:grid-cols-3">
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Humedad (%)</label>
                                    <input
                                        type="number"
                                        name="humedad"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="Ej: 12.5"
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                                        placeholder="Ej: 2.0"
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                                        placeholder="Ej: 1.5"
                                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Details Section */}
                        {selectedFruitType.value && (
                            <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 class="font-semibold text-lg">Agregar Pesada</h3>
                                        {totalContainers.value && parseInt(totalContainers.value) > 0 && (
                                            <div class="flex gap-3 mt-2 text-sm">
                                                <span class="text-gray-600">
                                                    Total Contenedores: <span class="font-semibold">{totalContainers.value}</span>
                                                </span>
                                                <span class={`font-semibold ${details.value.reduce((sum, d) => sum + d.quantity, 0) === parseInt(totalContainers.value)
                                                    ? 'text-green-600'
                                                    : details.value.reduce((sum, d) => sum + d.quantity, 0) > parseInt(totalContainers.value)
                                                        ? 'text-red-600'
                                                        : 'text-orange-600'
                                                    }`}>
                                                    Asignados: {details.value.reduce((sum, d) => sum + d.quantity, 0)}
                                                </span>
                                                <span class={`font-semibold ${parseInt(totalContainers.value) - details.value.reduce((sum, d) => sum + d.quantity, 0) === 0
                                                    ? 'text-green-600'
                                                    : parseInt(totalContainers.value) - details.value.reduce((sum, d) => sum + d.quantity, 0) < 0
                                                        ? 'text-red-600'
                                                        : 'text-orange-600'
                                                    }`}>
                                                    Restantes: {parseInt(totalContainers.value) - details.value.reduce((sum, d) => sum + d.quantity, 0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div class="grid gap-4 md:grid-cols-3">
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium leading-none">Cantidad *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={currentDetail.value.quantity}
                                            onInput$={(e) => currentDetail.value = { ...currentDetail.value, quantity: Number((e.target as HTMLInputElement).value) }}
                                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium leading-none">Peso (kg) *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={currentDetail.value.weightKg}
                                            onInput$={(e) => currentDetail.value = { ...currentDetail.value, weightKg: Number((e.target as HTMLInputElement).value) }}
                                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div class="flex items-end">
                                        <button type="button" onClick$={addDetail} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2 w-full">
                                            <PlusIcon class="h-4 w-4 mr-2" />
                                            Agregar Detalle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Details Table */}
                        {details.value.length > 0 && (
                            <div class="rounded-md border">
                                <table class="w-full caption-bottom text-sm">
                                    <thead class="[&_tr]:border-b">
                                        <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">#</th>
                                            <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Cantidad</th>
                                            <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Peso (kg)</th>
                                            <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"></th>
                                        </tr>
                                    </thead>
                                    <tbody class="[&_tr:last-child]:border-0">
                                        {details.value.map((d, i) => (
                                            <tr key={i} class="border-b transition-colors hover:bg-muted/50">
                                                <td class="p-4 align-middle">{i + 1}</td>
                                                <td class="p-4 align-middle text-right">{d.quantity}</td>
                                                <td class="p-4 align-middle text-right">{d.weightKg}</td>
                                                <td class="p-4 align-middle text-right">
                                                    <button type="button" onClick$={() => removeDetail(i)} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                                                        <Trash2Icon class="h-4 w-4 text-red-500" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div class="flex justify-end">
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2">
                                Guardar Recepción
                            </button>
                        </div>
                    </Form>
                </div>

                {/* Sidebar for Pricing Preview */}
                <div class="space-y-6">
                    {selectedFruitType.value && (
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 class="font-semibold mb-4 text-lg">Estimación de Calidad</h3>
                            <p class="text-xs text-gray-500 mb-4">Ingrese valores estimados para previsualizar descuentos.</p>

                            <div class="space-y-4">
                                {qualityMetrics.value.map((m, i) => (
                                    <div key={m.metric} class="space-y-1">
                                        <label class="text-sm font-medium text-gray-700">{m.metric} (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={m.value}
                                            onInput$={(e) => {
                                                const newValue = Number((e.target as HTMLInputElement).value);
                                                const newMetrics = [...qualityMetrics.value];
                                                newMetrics[i].value = newValue;
                                                qualityMetrics.value = newMetrics;
                                            }}
                                            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {totalWeight > 0 && selectedFruitType.value && (
                        <PricingPreview
                            fruitType={selectedFruitTypeName}
                            totalWeight={totalWeight}
                            qualityMetrics={qualityMetrics.value}
                            basePricePerKg={basePrice.value}
                        />
                    )}
                </div>
            </div>
        </div>
    );
});
