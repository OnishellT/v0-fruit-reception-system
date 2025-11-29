import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { providers, asociaciones } from '~/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-qwik';

export const useProviders = routeLoader$(async () => {
    try {
        const data = await db
            .select({
                id: providers.id,
                code: providers.code,
                name: providers.name,
                contactPerson: providers.contactPerson,
                phone: providers.phone,
                asociacionName: asociaciones.name,
            })
            .from(providers)
            .leftJoin(asociaciones, eq(providers.asociacionId, asociaciones.id))
            .where(eq(providers.isActive, true))
            .orderBy(desc(providers.createdAt));

        return { success: true, providers: data };
    } catch (error) {
        console.error('Error fetching providers:', error);
        return {
            success: false,
            error: `Failed to fetch providers: ${error instanceof Error ? error.message : String(error)}`,
            providers: []
        };
    }
});

export const useDeleteProvider = routeAction$(async ({ id }, { redirect }) => {
    await db
        .update(providers)
        .set({ isActive: false })
        .where(eq(providers.id, id));

    throw redirect(302, '/dashboard/proveedores');
}, zod$({
    id: z.string(),
}));

export default component$(() => {
    const providersSignal = useProviders();
    const deleteAction = useDeleteProvider();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Proveedores</h1>
                    <p class="text-gray-500 mt-1">Gestión de proveedores de frutos</p>
                </div>
                <Link href="/dashboard/proveedores/new" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
                    <PlusIcon class="h-4 w-4" />
                    Nuevo Proveedor
                </Link>
            </div>

            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <div class="relative w-full overflow-auto">
                        <table class="w-full caption-bottom text-sm">
                            <thead class="[&_tr]:border-b">
                                <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Código</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Asociación</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contacto</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Teléfono</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="[&_tr:last-child]:border-0">
                                {!providersSignal.value.success ? (
                                    <tr>
                                        <td colSpan={6} class="p-4 text-center text-red-600">
                                            {providersSignal.value.error}
                                        </td>
                                    </tr>
                                ) : providersSignal.value.providers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} class="p-4 text-center text-muted-foreground">
                                            No hay proveedores registrados
                                        </td>
                                    </tr>
                                ) : (
                                    providersSignal.value.providers.map((provider) => (
                                        <tr key={provider.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle font-medium">{provider.code}</td>
                                            <td class="p-4 align-middle">{provider.name}</td>
                                            <td class="p-4 align-middle">
                                                {provider.asociacionName ? (
                                                    <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                        {provider.asociacionName}
                                                    </span>
                                                ) : (
                                                    <span class="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td class="p-4 align-middle">{provider.contactPerson || '-'}</td>
                                            <td class="p-4 align-middle">{provider.phone || '-'}</td>
                                            <td class="p-4 align-middle text-right">
                                                <div class="flex justify-end gap-2">
                                                    <Link
                                                        href={`/dashboard/proveedores/${provider.id}`}
                                                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                    >
                                                        <PencilIcon class="h-4 w-4" />
                                                    </Link>

                                                    <Form action={deleteAction}>
                                                        <input type="hidden" name="id" value={provider.id} />
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
            </div>
        </div>
    );
});
