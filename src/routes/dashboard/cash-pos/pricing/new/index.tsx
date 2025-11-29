import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashDailyPrices, cashFruitTypes } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';

export const useFruitTypes = routeLoader$(async () => {
    return await db
        .select({ id: cashFruitTypes.id, name: cashFruitTypes.name, code: cashFruitTypes.code })
        .from(cashFruitTypes)
        .where(eq(cashFruitTypes.enabled, true));
});

export const useCreatePrice = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const { fruitTypeId, priceDate, pricePerKg } = data;
    const fruitTypeIdInt = parseInt(fruitTypeId);

    // Deactivate previous prices for this fruit type on this date (if any)
    // Although the schema allows multiple, logically we should probably only have one active per day.
    // Or maybe we just insert a new one and it becomes the latest.
    // The list view orders by created_at desc, so latest one wins.
    // But let's mark others as inactive to be clean if we want strict history.
    // For now, simple insert.

    await db.insert(cashDailyPrices).values({
        fruitTypeId: fruitTypeIdInt,
        priceDate: priceDate,
        pricePerKg: pricePerKg,
        createdBy: session.id,
        active: true,
    });

    throw redirect(302, '/dashboard/cash-pos/pricing');
}, zod$({
    fruitTypeId: z.string().min(1, "Tipo de fruta requerido"),
    priceDate: z.string().min(1, "Fecha requerida"),
    pricePerKg: z.string().min(1, "Precio requerido"),
}));

export default component$(() => {
    const fruitTypes = useFruitTypes();
    const createAction = useCreatePrice();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Nuevo Precio Diario</h2>
                    <p class="text-sm text-gray-500 mt-1">Establecer precio para un tipo de fruta en una fecha específica</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl">
                <div class="p-6">
                    <Form action={createAction} class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="fruitTypeId">Tipo de Fruta *</label>
                            <select name="fruitTypeId" required class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="">Seleccione tipo de fruta</option>
                                {fruitTypes.value.map(f => (
                                    <option key={f.id} value={f.id}>{`${f.name} (${f.code})`}</option>
                                ))}
                            </select>
                            {createAction.value?.fieldErrors?.fruitTypeId && <p class="text-sm text-red-500">{createAction.value.fieldErrors.fruitTypeId}</p>}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="priceDate">Fecha *</label>
                            <input type="date" name="priceDate" required defaultValue={new Date().toISOString().split('T')[0]} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            {createAction.value?.fieldErrors?.priceDate && <p class="text-sm text-red-500">{createAction.value.fieldErrors.priceDate}</p>}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="pricePerKg">Precio por Kg (RD$) *</label>
                            <input type="number" name="pricePerKg" required step="0.01" min="0" placeholder="0.00" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            {createAction.value?.fieldErrors?.pricePerKg && <p class="text-sm text-red-500">{createAction.value.fieldErrors.pricePerKg}</p>}
                        </div>

                        {createAction.value?.failed && (
                            <div class="p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                                <span class="font-medium">Error:</span> {createAction.value.formErrors?.[0] || 'Error al guardar el precio'}
                            </div>
                        )}

                        <div class="flex justify-end gap-4">
                            <button type="button" onClick$={() => history.back()} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                Cancelar
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                Guardar Precio
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
