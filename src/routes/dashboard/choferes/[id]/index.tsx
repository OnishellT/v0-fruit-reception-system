import { component$, useSignal } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { drivers, receptions, providers, auditLogs } from '~/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ArrowLeftIcon, PencilIcon, EyeIcon, Trash2Icon } from 'lucide-qwik';

export const useDriver = routeLoader$(async ({ params, status, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) {
        status(401);
        return null;
    }

    const [driver] = await db
        .select()
        .from(drivers)
        .where(eq(drivers.id, params.id));

    if (!driver || driver.deletedAt) {
        status(404);
        return null;
    }

    // Get recent receptions for this driver
    const recentReceptions = await db
        .select({
            id: receptions.id,
            receptionNumber: receptions.receptionNumber,
            receptionDate: receptions.receptionDate,
            providerName: providers.name,
            totalPesoOriginal: receptions.totalPesoOriginal,
            status: receptions.status,
        })
        .from(receptions)
        .leftJoin(providers, eq(receptions.providerId, providers.id))
        .where(eq(receptions.driverId, params.id))
        .orderBy(desc(receptions.receptionDate))
        .limit(10);

    return { driver, recentReceptions };
});

export const useUpdateDriver = routeAction$(async (data, { redirect, params, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    await db.update(drivers).set({
        name: data.name,
        licenseNumber: data.licenseNumber || null,
        phone: data.phone || null,
        updatedAt: new Date(),
    }).where(eq(drivers.id, params.id));

    // Audit log
    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'update_driver',
        tableName: 'drivers',
        recordId: params.id,
    });

    throw redirect(302, `/dashboard/choferes/${params.id}`);
}, zod$({
    name: z.string().min(1, 'Nombre requerido'),
    licenseNumber: z.string().optional(),
    phone: z.string().optional(),
}));

export const useDeleteDriver = routeAction$(async (_, { redirect, params, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    await db.update(drivers).set({
        deletedAt: new Date(),
        isActive: false,
    }).where(eq(drivers.id, params.id));

    // Audit log
    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'delete_driver',
        tableName: 'drivers',
        recordId: params.id,
    });

    throw redirect(302, '/dashboard/choferes');
}, zod$({}));

export default component$(() => {
    const dataSignal = useDriver();
    const updateAction = useUpdateDriver();
    const deleteAction = useDeleteDriver();
    const isEditing = useSignal(false);
    const showDeleteConfirm = useSignal(false);

    if (!dataSignal.value) {
        return <div class="p-6 text-red-600">Chofer no encontrado</div>;
    }

    const { driver, recentReceptions } = dataSignal.value;

    return (
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <Link href="/dashboard/choferes" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    <ArrowLeftIcon class="h-4 w-4 mr-2" />
                    Volver
                </Link>
                <div class="flex-1">
                    <h1 class="text-3xl font-bold text-gray-900">{driver.name}</h1>
                    <p class="text-gray-600 mt-1">Información del chofer</p>
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
                    <button
                        onClick$={() => showDeleteConfirm.value = true}
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-200 bg-white hover:bg-red-50 text-red-600 h-10 px-4 py-2 gap-2"
                    >
                        <Trash2Icon class="h-4 w-4" />
                        Eliminar
                    </button>
                </div>
            </div>

            {isEditing.value ? (
                <div class="bg-white rounded-lg border shadow-sm p-6">
                    <h3 class="text-lg font-semibold mb-4">Editar Chofer</h3>
                    <Form action={updateAction} class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={driver.name}
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="licenseNumber">
                                    Número de Licencia
                                </label>
                                <input
                                    type="text"
                                    id="licenseNumber"
                                    name="licenseNumber"
                                    value={driver.licenseNumber || ''}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="phone">
                                    Teléfono
                                </label>
                                <input
                                    type="text"
                                    id="phone"
                                    name="phone"
                                    value={driver.phone || ''}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
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
                    <h3 class="text-lg font-semibold mb-4">Información del Chofer</h3>
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <p class="text-sm text-gray-500">Nombre</p>
                            <p class="font-medium mt-1">{driver.name}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Número de Licencia</p>
                            <p class="font-medium mt-1">{driver.licenseNumber || '-'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Teléfono</p>
                            <p class="font-medium mt-1">{driver.phone || '-'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Estado</p>
                            <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${driver.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {driver.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Receptions */}
            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <h3 class="text-lg font-semibold mb-4">Recepciones Recientes ({recentReceptions.length})</h3>
                    {recentReceptions.length > 0 ? (
                        <div class="relative w-full overflow-auto">
                            <table class="w-full caption-bottom text-sm">
                                <thead class="[&_tr]:border-b">
                                    <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Número</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Proveedor</th>
                                        <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Peso (kg)</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                                    </tr>
                                </thead>
                                <tbody class="[&_tr:last-child]:border-0">
                                    {recentReceptions.map((reception) => (
                                        <tr key={reception.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle">
                                                <Link href={`/dashboard/reception/${reception.id}`} class="hover:underline text-blue-600">
                                                    {reception.receptionNumber}
                                                </Link>
                                            </td>
                                            <td class="p-4 align-middle">{reception.receptionDate ? new Date(reception.receptionDate).toLocaleDateString() : '-'}</td>
                                            <td class="p-4 align-middle">{reception.providerName}</td>
                                            <td class="p-4 align-middle text-right">{Number(reception.totalPesoOriginal).toFixed(2)}</td>
                                            <td class="p-4 align-middle">
                                                <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${reception.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {reception.status === 'completed' ? 'Completada' : 'Pendiente'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p class="text-gray-500 text-center py-8">No hay recepciones registradas para este chofer</p>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm.value && (
                <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h3 class="text-lg font-bold mb-4">Confirmar Eliminación</h3>
                        <p class="text-gray-600 mb-6">
                            ¿Está seguro que desea eliminar este chofer? Esta acción marcará al chofer como eliminado.
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
