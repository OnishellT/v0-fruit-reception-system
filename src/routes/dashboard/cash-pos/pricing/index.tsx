import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashDailyPrices, cashFruitTypes } from '~/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { PlusIcon } from 'lucide-qwik';

export const useCashPrices = routeLoader$(async () => {
    const prices = await db
        .select({
            id: cashDailyPrices.id,
            fruitTypeId: cashDailyPrices.fruitTypeId,
            fruitTypeName: cashFruitTypes.name,
            priceDate: cashDailyPrices.priceDate,
            pricePerKg: cashDailyPrices.pricePerKg,
            active: cashDailyPrices.active,
            createdAt: cashDailyPrices.createdAt,
        })
        .from(cashDailyPrices)
        .innerJoin(cashFruitTypes, eq(cashDailyPrices.fruitTypeId, cashFruitTypes.id))
        .orderBy(desc(cashDailyPrices.priceDate), desc(cashDailyPrices.createdAt));

    return prices;
});

export const useFruitTypes = routeLoader$(async () => {
    const fruitTypes = await db
        .select()
        .from(cashFruitTypes)
        .where(eq(cashFruitTypes.enabled, true))
        .orderBy(cashFruitTypes.name);

    return fruitTypes;
});

export const useCreatePrice = routeAction$(async (data, { cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) return { success: false, message: 'No autorizado' };

    const { fruitTypeId, priceDate, pricePerKg } = data;

    // Check for duplicate
    const existing = await db
        .select()
        .from(cashDailyPrices)
        .where(
            and(
                eq(cashDailyPrices.fruitTypeId, fruitTypeId),
                eq(cashDailyPrices.priceDate, priceDate)
            )
        )
        .limit(1);

    if (existing.length > 0) {
        return {
            success: false,
            message: 'Ya existe un precio para esta fruta en esta fecha'
        };
    }

    await db.insert(cashDailyPrices).values({
        fruitTypeId,
        priceDate,
        pricePerKg: pricePerKg.toString(),
        createdBy: session.id,
        active: true,
    });

    return { success: true };
}, zod$({
    fruitTypeId: z.coerce.number(),
    priceDate: z.string().min(1, 'La fecha es requerida'),
    pricePerKg: z.coerce.number().positive('El precio debe ser mayor a 0'),
}));

export const useTogglePrice = routeAction$(async ({ id, active }) => {
    await db
        .update(cashDailyPrices)
        .set({ active: active === 'true' })
        .where(eq(cashDailyPrices.id, parseInt(id)));

    return { success: true };
}, zod$({
    id: z.string(),
    active: z.string(),
}));

export default component$(() => {
    const pricesSignal = useCashPrices();
    const fruitTypesSignal = useFruitTypes();
    const createAction = useCreatePrice();
    const toggleAction = useTogglePrice();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Precios Diarios</h1>
                    <p class="text-gray-500 mt-1">Gestionar precios por kilogramo para cada tipo de fruta</p>
                </div>
            </div>

            {/* Create Price Form */}
            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <h3 class="font-semibold mb-4 flex items-center gap-2">
                        <PlusIcon class="h-5 w-5" />
                        Agregar Nuevo Precio
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
                            <label class="text-sm font-medium">Fecha *</label>
                            <input
                                type="date"
                                name="priceDate"
                                required
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            {createAction.value?.fieldErrors?.priceDate && (
                                <p class="text-sm text-red-500">{createAction.value.fieldErrors.priceDate}</p>
                            )}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Precio/Kg (RD$) *</label>
                            <input
                                type="number"
                                name="pricePerKg"
                                required
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            {createAction.value?.fieldErrors?.pricePerKg && (
                                <p class="text-sm text-red-500">{createAction.value.fieldErrors.pricePerKg}</p>
                            )}
                        </div>

                        <div class="flex items-end">
                            <button
                                type="submit"
                                class="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                Agregar Precio
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
                            <span class="font-medium">Éxito:</span> Precio agregado correctamente
                        </div>
                    )}
                </div>
            </div>

            {/* Prices List */}
            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <h3 class="font-semibold mb-4">Historial de Precios</h3>
                    <div class="relative w-full overflow-auto">
                        <table class="w-full caption-bottom text-sm">
                            <thead class="[&_tr]:border-b">
                                <tr class="border-b transition-colors hover:bg-muted/50">
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo de Fruta</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Precio/Kg</th>
                                    <th class="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Estado</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Creado</th>
                                </tr>
                            </thead>
                            <tbody class="[&_tr:last-child]:border-0">
                                {pricesSignal.value.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} class="p-4 text-center text-muted-foreground">
                                            No hay precios registrados
                                        </td>
                                    </tr>
                                ) : (
                                    pricesSignal.value.map((price) => (
                                        <tr key={price.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle font-medium">
                                                {new Date(price.priceDate).toLocaleDateString('es-DO')}
                                            </td>
                                            <td class="p-4 align-middle">{price.fruitTypeName}</td>
                                            <td class="p-4 align-middle text-right font-mono font-semibold text-green-600">
                                                RD$ {Number(price.pricePerKg).toFixed(2)}
                                            </td>
                                            <td class="p-4 align-middle text-center">
                                                <Form action={toggleAction}>
                                                    <input type="hidden" name="id" value={price.id} />
                                                    <input type="hidden" name="active" value={(!price.active).toString()} />
                                                    <button type="submit" class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${price.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {price.active ? 'Activo' : 'Inactivo'}
                                                    </button>
                                                </Form>
                                            </td>
                                            <td class="p-4 align-middle text-sm text-gray-500">
                                                {new Date(price.createdAt).toLocaleDateString('es-DO')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
});
