import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashFruitTypes, cashDailyPrices, cashReceptions } from '~/lib/db/schema';
import { eq, desc, like, sql } from 'drizzle-orm';
import { PlusIcon, PencilIcon, Trash2Icon, SearchIcon } from 'lucide-qwik';

export const useCashFruitTypes = routeLoader$(async ({ url }) => {
    const search = url.searchParams.get('search');

    const query = db
        .select({
            id: cashFruitTypes.id,
            code: cashFruitTypes.code,
            name: cashFruitTypes.name,
            enabled: cashFruitTypes.enabled,
            createdAt: cashFruitTypes.createdAt,
        })
        .from(cashFruitTypes)
        .orderBy(desc(cashFruitTypes.createdAt));

    if (search) {
        query.where(
            like(cashFruitTypes.name, `%${search}%`)
        );
    }

    return await query;
});

export const useToggleFruitType = routeAction$(async ({ id, enabled }) => {
    await db
        .update(cashFruitTypes)
        .set({ enabled: enabled === 'true' })
        .where(eq(cashFruitTypes.id, parseInt(id)));

    return { success: true };
}, zod$({
    id: z.string(),
    enabled: z.string(),
}));

export const useDeleteFruitType = routeAction$(async ({ id }, { redirect }) => {
    const fruitTypeId = parseInt(id);

    // Check for dependencies in receptions
    const receptions = await db
        .select({ count: sql<number>`count(*)` })
        .from(cashReceptions)
        .where(eq(cashReceptions.fruitTypeId, fruitTypeId));

    if (receptions[0].count > 0) {
        return {
            success: false,
            message: "No se puede eliminar porque tiene recepciones asociadas"
        };
    }

    // Check for dependencies in prices
    const prices = await db
        .select({ count: sql<number>`count(*)` })
        .from(cashDailyPrices)
        .where(eq(cashDailyPrices.fruitTypeId, fruitTypeId));

    if (prices[0].count > 0) {
        return {
            success: false,
            message: "No se puede eliminar porque tiene precios asociados"
        };
    }

    await db.delete(cashFruitTypes).where(eq(cashFruitTypes.id, fruitTypeId));

    throw redirect(302, '/dashboard/cash-pos/fruit-types');
}, zod$({
    id: z.string(),
}));

export default component$(() => {
    const fruitTypesSignal = useCashFruitTypes();
    const toggleAction = useToggleFruitType();
    const deleteAction = useDeleteFruitType();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Tipos de Fruta</h1>
                    <p class="text-gray-500 mt-1">Gestionar tipos de fruta disponibles para recepciones</p>
                </div>
                <Link href="/dashboard/cash-pos/fruit-types/new" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
                    <PlusIcon class="h-4 w-4" />
                    Nuevo Tipo de Fruta
                </Link>
            </div>

            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    {/* Search */}
                    <Form class="flex items-center space-x-2 mb-6">
                        <div class="relative flex-1 max-w-sm">
                            <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                            <input
                                type="text"
                                name="search"
                                placeholder="Buscar por nombre..."
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                            Buscar
                        </button>
                    </Form>

                    <div class="relative w-full overflow-auto">
                        <table class="w-full caption-bottom text-sm">
                            <thead class="[&_tr]:border-b">
                                <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Código</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
                                    <th class="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Estado</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha Creación</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="[&_tr:last-child]:border-0">
                                {fruitTypesSignal.value.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} class="p-4 text-center text-muted-foreground">
                                            No hay tipos de fruta registrados
                                        </td>
                                    </tr>
                                ) : (
                                    fruitTypesSignal.value.map((fruitType) => (
                                        <tr key={fruitType.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle font-mono font-semibold">{fruitType.code}</td>
                                            <td class="p-4 align-middle font-medium">{fruitType.name}</td>
                                            <td class="p-4 align-middle text-center">
                                                <Form action={toggleAction}>
                                                    <input type="hidden" name="id" value={fruitType.id} />
                                                    <input type="hidden" name="enabled" value={(!fruitType.enabled).toString()} />
                                                    <button type="submit" class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${fruitType.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {fruitType.enabled ? 'Activo' : 'Inactivo'}
                                                    </button>
                                                </Form>
                                            </td>
                                            <td class="p-4 align-middle">
                                                {new Date(fruitType.createdAt).toLocaleDateString('es-DO')}
                                            </td>
                                            <td class="p-4 align-middle text-right">
                                                <div class="flex justify-end gap-2">
                                                    <Link href={`/dashboard/cash-pos/fruit-types/${fruitType.id}`} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                                                        <PencilIcon class="h-4 w-4" />
                                                    </Link>

                                                    <Form action={deleteAction}>
                                                        <input type="hidden" name="id" value={fruitType.id} />
                                                        <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-red-100 hover:text-red-600 h-9 w-9">
                                                            <Trash2Icon class="h-4 w-4" />
                                                        </button>
                                                    </Form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {deleteAction.value?.failed && (
                        <div class="mt-4 p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                            <span class="font-medium">Error:</span> {deleteAction.value.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
