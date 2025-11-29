import { component$, useSignal } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { asociaciones, providers, auditLogs } from '~/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ArrowLeftIcon, PencilIcon, EyeIcon, Trash2Icon } from 'lucide-qwik';

export const useAsociacion = routeLoader$(async ({ params, status, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) {
        status(401);
        return null;
    }

    const [asociacion] = await db
        .select()
        .from(asociaciones)
        .where(eq(asociaciones.id, params.id));

    if (!asociacion || asociacion.deletedAt) {
        status(404);
        return null;
    }

    // Get associated providers
    const associatedProviders = await db
        .select()
        .from(providers)
        .where(eq(providers.asociacionId, params.id))
        .orderBy(desc(providers.createdAt));

    return { asociacion, providers: associatedProviders };
});

export const useUpdateAsociacion = routeAction$(async (data, { redirect, params, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    await db.update(asociaciones).set({
        code: data.code,
        name: data.name,
        description: data.description || null,
    }).where(eq(asociaciones.id, params.id));

    // Audit log
    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'update_asociacion',
        tableName: 'asociaciones',
        recordId: params.id,
    });

    throw redirect(302, `/dashboard/asociaciones/${params.id}`);
}, zod$({
    code: z.string().min(1, 'Código requerido'),
    name: z.string().min(1, 'Nombre requerido'),
    description: z.string().optional(),
}));

export const useDeleteAsociacion = routeAction$(async (_, { redirect, params, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    // Check if there are associated providers
    const [hasProviders] = await db
        .select()
        .from(providers)
        .where(eq(providers.asociacionId, params.id))
        .limit(1);

    if (hasProviders) {
        return {
            success: false,
            error: 'No se puede eliminar una asociación con proveedores asociados',
        };
    }

    await db.update(asociaciones).set({
        deletedAt: new Date(),
    }).where(eq(asociaciones.id, params.id));

    // Audit log
    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'delete_asociacion',
        tableName: 'asociaciones',
        recordId: params.id,
    });

    throw redirect(302, '/dashboard/asociaciones');
}, zod$({}));

export default component$(() => {
    const dataSignal = useAsociacion();
    const updateAction = useUpdateAsociacion();
    const deleteAction = useDeleteAsociacion();
    const isEditing = useSignal(false);
    const showDeleteConfirm = useSignal(false);

    if (!dataSignal.value) {
        return <div class="p-6 text-red-600">Asociación no encontrada</div>;
    }

    const { asociacion, providers: associatedProviders } = dataSignal.value;

    return (
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <Link href="/dashboard/asociaciones" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    <ArrowLeftIcon class="h-4 w-4 mr-2" />
                    Volver
                </Link>
                <div class="flex-1">
                    <h1 class="text-3xl font-bold text-gray-900">{asociacion.name}</h1>
                    <p class="text-gray-600 mt-1">{asociacion.code}</p>
                </div>
                <div class="flex gap-2">
                    {!isEditing.value ? (
                        <button
                            onClick$={() => isEditing.value = true}
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2 gap-2"
                        >
                            <PencilIcon class="h-4 w-4" />
                            Editar
                        </button>
                    ) : (
                        <button
                            onClick$={() => isEditing.value = false}
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                        >
                            <EyeIcon class="h-4 w-4" />
                            Ver
                        </button>
                    )}
                    {associatedProviders.length === 0 && (
                        <button
                            onClick$={() => showDeleteConfirm.value = true}
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-200 bg-white hover:bg-red-50 text-red-600 h-10 px-4 py-2 gap-2"
                        >
                            <Trash2Icon class="h-4 w-4" />
                            Eliminar
                        </button>
                    )}
                </div>
            </div>

            {isEditing.value ? (
                <div class="bg-white rounded-lg border shadow-sm p-6">
                    <h3 class="text-lg font-semibold mb-4">Editar Asociación</h3>
                    <Form action={updateAction} class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="code">
                                    Código *
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={asociacion.code}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                />
                            </div>
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={asociacion.name}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="description">
                                Descripción
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >{asociacion.description || ''}</textarea>
                        </div>

                        <div class="flex justify-end gap-2 pt-4">
                            <button
                                type="button"
                                onClick$={() => isEditing.value = false}
                                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </Form>
                </div>
            ) : (
                <div class="bg-white rounded-lg border shadow-sm p-6">
                    <h3 class="text-lg font-semibold mb-4">Información de la Asociación</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <p class="text-sm text-gray-500">Código</p>
                                <p class="font-medium mt-1">{asociacion.code}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Nombre</p>
                                <p class="font-medium mt-1">{asociacion.name}</p>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Descripción</p>
                            <p class="font-medium mt-1">{asociacion.description || '-'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Proveedores Asociados</p>
                            <p class="font-medium mt-1">{associatedProviders.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Associated Providers */}
            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <h3 class="text-lg font-semibold mb-4">Proveedores de esta Asociación ({associatedProviders.length})</h3>
                    {associatedProviders.length > 0 ? (
                        <div class="relative w-full overflow-auto">
                            <table class="w-full caption-bottom text-sm">
                                <thead class="[&_tr]:border-b">
                                    <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Código</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contacto</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Teléfono</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                                    </tr>
                                </thead>
                                <tbody class="[&_tr:last-child]:border-0">
                                    {associatedProviders.map((provider) => (
                                        <tr key={provider.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle">
                                                <Link href={`/dashboard/proveedores/${provider.id}`} class="hover:underline text-blue-600">
                                                    {provider.code}
                                                </Link>
                                            </td>
                                            <td class="p-4 align-middle font-medium">{provider.name}</td>
                                            <td class="p-4 align-middle">{provider.contactPerson || '-'}</td>
                                            <td class="p-4 align-middle">{provider.phone || '-'}</td>
                                            <td class="p-4 align-middle">
                                                <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${provider.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {provider.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p class="text-gray-500 text-center py-8">No hay proveedores asociados a esta asociación</p>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm.value && (
                <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h3 class="text-lg font-bold mb-4">Confirmar Eliminación</h3>
                        <p class="text-gray-600 mb-6">
                            ¿Está seguro que desea eliminar esta asociación? Esta acción marcará la asociación como eliminada.
                        </p>
                        <div class="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick$={() => showDeleteConfirm.value = false}
                                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                            >
                                Cancelar
                            </button>
                            <Form action={deleteAction}>
                                <button
                                    type="submit"
                                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2"
                                >
                                    Eliminar
                                </button>
                            </Form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
