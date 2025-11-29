import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link, routeAction$, Form, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { fruitTypes } from '~/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-qwik';

export const useFruitTypes = routeLoader$(async () => {
    const data = await db
        .select()
        .from(fruitTypes)
        .where(eq(fruitTypes.isActive, true))
        .orderBy(desc(fruitTypes.createdAt));

    return data;
});

export const useDeleteFruitType = routeAction$(async ({ id }, { redirect }) => {
    await db
        .update(fruitTypes)
        .set({ isActive: false })
        .where(eq(fruitTypes.id, id));
    throw redirect(302, '/dashboard/tipos-fruto');
}, zod$({
    id: z.string(),
}));

export default component$(() => {
    const fruitTypesSignal = useFruitTypes();
    const deleteAction = useDeleteFruitType();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Tipos de Fruto</h1>
                    <p class="text-gray-500 mt-1">Gestión de tipos y subtipos de frutos</p>
                </div>
                <Link href="/dashboard/tipos-fruto/new" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
                    <PlusIcon class="h-4 w-4" />
                    Nuevo Tipo
                </Link>
            </div>

            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <div class="relative w-full overflow-auto">
                        <table class="w-full caption-bottom text-sm">
                            <thead class="[&_tr]:border-b">
                                <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Subtipo</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Descripción</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="[&_tr:last-child]:border-0">
                                {fruitTypesSignal.value.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} class="p-4 text-center text-muted-foreground">
                                            No hay tipos de fruto registrados
                                        </td>
                                    </tr>
                                ) : (
                                    fruitTypesSignal.value.map((fruitType) => (
                                        <tr key={fruitType.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle font-medium">{fruitType.type}</td>
                                            <td class="p-4 align-middle">{fruitType.subtype}</td>
                                            <td class="p-4 align-middle">{fruitType.description || '-'}</td>
                                            <td class="p-4 align-middle text-right">
                                                <div class="flex justify-end gap-2">
                                                    <Link
                                                        href={`/dashboard/tipos-fruto/${fruitType.id}`}
                                                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                    >
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
                </div>
            </div >
        </div >
    );
});
