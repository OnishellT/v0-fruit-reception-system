import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashFruitTypes } from '~/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export const useFruitType = routeLoader$(async ({ params, redirect }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) throw redirect(302, '/dashboard/cash-pos/fruit-types');

    const [fruitType] = await db
        .select()
        .from(cashFruitTypes)
        .where(eq(cashFruitTypes.id, id))
        .limit(1);

    if (!fruitType) throw redirect(302, '/dashboard/cash-pos/fruit-types');

    return fruitType;
});

export const useUpdateFruitType = routeAction$(async (data, { params, redirect }) => {
    const fruitTypeId = parseInt(params.id);
    const { code, name } = data;

    // Check for duplicate code (excluding current fruit type)
    const existing = await db
        .select()
        .from(cashFruitTypes)
        .where(
            and(
                eq(cashFruitTypes.code, code),
                ne(cashFruitTypes.id, fruitTypeId)
            )
        )
        .limit(1);

    if (existing.length > 0) {
        return {
            success: false,
            message: "Ya existe otro tipo de fruta con este código"
        };
    }

    await db
        .update(cashFruitTypes)
        .set({
            code,
            name,
        })
        .where(eq(cashFruitTypes.id, fruitTypeId));

    throw redirect(302, '/dashboard/cash-pos/fruit-types');
}, zod$({
    code: z.string().min(1, "El código es requerido").max(32),
    name: z.string().min(1, "El nombre es requerido").max(64),
}));

export default component$(() => {
    const fruitTypeSignal = useFruitType();
    const updateAction = useUpdateFruitType();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Editar Tipo de Fruta</h2>
                    <p class="text-sm text-gray-500 mt-1">Actualice la información del tipo de fruta</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl">
                <div class="p-6">
                    <Form action={updateAction} class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="code">Código *</label>
                            <input
                                type="text"
                                name="code"
                                required
                                value={fruitTypeSignal.value.code}
                                placeholder="CAFE, CACAO, etc."
                                maxLength={32}
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {updateAction.value?.fieldErrors?.code && <p class="text-sm text-red-500">{updateAction.value.fieldErrors.code}</p>}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">Nombre *</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={fruitTypeSignal.value.name}
                                placeholder="Café, Cacao, Miel, Cocos"
                                maxLength={64}
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {updateAction.value?.fieldErrors?.name && <p class="text-sm text-red-500">{updateAction.value.fieldErrors.name}</p>}
                        </div>

                        {updateAction.value?.failed && (
                            <div class="p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                                <span class="font-medium">Error:</span> {updateAction.value.message}
                            </div>
                        )}

                        <div class="flex justify-end gap-4">
                            <button type="button" onClick$={() => history.back()} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                Cancelar
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                Actualizar Tipo de Fruta
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
