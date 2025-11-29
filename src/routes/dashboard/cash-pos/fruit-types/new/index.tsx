import { component$ } from '@builder.io/qwik';
import { routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashFruitTypes } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';

export const useCreateFruitType = routeAction$(async (data, { redirect }) => {
    const { code, name } = data;

    // Check for duplicate code
    const existing = await db
        .select()
        .from(cashFruitTypes)
        .where(eq(cashFruitTypes.code, code))
        .limit(1);

    if (existing.length > 0) {
        return {
            success: false,
            message: "Ya existe un tipo de fruta con este código"
        };
    }

    await db.insert(cashFruitTypes).values({
        code,
        name,
        enabled: true,
    });

    throw redirect(302, '/dashboard/cash-pos/fruit-types');
}, zod$({
    code: z.string().min(1, "El código es requerido"),
    name: z.string().min(1, "El nombre es requerido"),
}));

export default component$(() => {
    const createAction = useCreateFruitType();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Nuevo Tipo de Fruta</h2>
                    <p class="text-sm text-gray-500 mt-1">Registre un nuevo tipo de fruta para el sistema POS</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl">
                <div class="p-6">
                    <Form action={createAction} class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="code">Código *</label>
                            <input type="text" name="code" required placeholder="Ej: CAFE" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            {createAction.value?.fieldErrors?.code && <p class="text-sm text-red-500">{createAction.value.fieldErrors.code}</p>}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">Nombre *</label>
                            <input type="text" name="name" required placeholder="Ej: Café Cereza" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            {createAction.value?.fieldErrors?.name && <p class="text-sm text-red-500">{createAction.value.fieldErrors.name}</p>}
                        </div>

                        {createAction.value?.failed && (
                            <div class="p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                                <span class="font-medium">Error:</span> {createAction.value.message}
                            </div>
                        )}

                        <div class="flex justify-end gap-4">
                            <button type="button" onClick$={() => history.back()} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                Cancelar
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                Guardar Tipo
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
