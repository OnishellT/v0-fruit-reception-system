import { component$, useSignal } from '@builder.io/qwik';
import { routeLoader$, routeAction$, zod$, z, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { fruitTypes, auditLogs } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ArrowLeftIcon, PencilIcon, EyeIcon, Trash2Icon } from 'lucide-qwik';

export const useFruitType = routeLoader$(async ({ params, status, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) {
        status(401);
        return null;
    }

    const [fruitType] = await db
        .select()
        .from(fruitTypes)
        .where(eq(fruitTypes.id, params.id));

    if (!fruitType || fruitType.deletedAt) {
        status(404);
        return null;
    }
    return fruitType;
});

export const useUpdateFruitType = routeAction$(async (data, { redirect, params, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    await db.update(fruitTypes).set({
        type: data.type,
        subtype: data.subtype,
        description: data.description || null,
        isActive: data.isActive === 'true',
    }).where(eq(fruitTypes.id, params.id));

    // Audit log
    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'update_fruit_type',
        tableName: 'fruit_types',
        recordId: params.id,
    });

    throw redirect(302, `/dashboard/tipos-fruto/${params.id}`);
}, zod$({
    type: z.string().min(1, 'Tipo requerido'),
    subtype: z.string().min(1, 'Subtipo requerido'),
    description: z.string().optional(),
    isActive: z.string(),
}));

export const useDeleteFruitType = routeAction$(async (_, { redirect, params, cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    await db.update(fruitTypes).set({
        deletedAt: new Date(),
        isActive: false,
    }).where(eq(fruitTypes.id, params.id));

    // Audit log
    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'delete_fruit_type',
        tableName: 'fruit_types',
        recordId: params.id,
    });

    throw redirect(302, '/dashboard/tipos-fruto');
}, zod$({}));

export default component$(() => {
    const fruitTypeSignal = useFruitType();
    const updateAction = useUpdateFruitType();
    const deleteAction = useDeleteFruitType();
    const isEditing = useSignal(false);
    const showDeleteConfirm = useSignal(false);

    if (!fruitTypeSignal.value) {
        return <div class="p-6 text-red-600">Tipo de fruto no encontrado</div>;
    }

    const fruitType = fruitTypeSignal.value;

    return (
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <Link href="/dashboard/tipos-fruto" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    <ArrowLeftIcon class="h-4 w-4 mr-2" />
                    Volver
                </Link>
                <div class="flex-1">
                    <h1 class="text-3xl font-bold text-gray-900">{fruitType.type} - {fruitType.subtype}</h1>
                    <p class="text-gray-600 mt-1">Tipo de fruto</p>
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
                <div class="max-w-2xl bg-white rounded-lg border shadow-sm p-6">
                    <h3 class="text-lg font-semibold mb-4">Editar Tipo de Fruto</h3>
                    <Form action={updateAction} class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="type">
                                    Tipo
                                </label>
                                <select
                                    id="type"
                                    name="type"
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="CACAO" selected={fruitType.type === 'CACAO'}>CACAO</option>
                                    <option value="CAFÉ" selected={fruitType.type === 'CAFÉ'}>CAFÉ</option>
                                    <option value="MIEL" selected={fruitType.type === 'MIEL'}>MIEL</option>
                                    <option value="COCOS" selected={fruitType.type === 'COCOS'}>COCOS</option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="subtype">
                                    Subtipo
                                </label>
                                <input
                                    type="text"
                                    id="subtype"
                                    name="subtype"
                                    value={fruitType.subtype}
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
                            >{fruitType.description || ''}</textarea>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="isActive">
                                Estado
                            </label>
                            <select
                                id="isActive"
                                name="isActive"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="true" selected={Boolean(fruitType.isActive)}>Activo</option>
                                <option value="false" selected={!fruitType.isActive}>Inactivo</option>
                            </select>
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
                <div class="max-w-2xl bg-white rounded-lg border shadow-sm p-6">
                    <h3 class="text-lg font-semibold mb-4">Información del Tipo de Fruto</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <p class="text-sm text-gray-500">Tipo</p>
                                <p class="font-medium mt-1">{fruitType.type}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Subtipo</p>
                                <p class="font-medium mt-1">{fruitType.subtype}</p>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Descripción</p>
                            <p class="font-medium mt-1">{fruitType.description || '-'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Estado</p>
                            <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${fruitType.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {fruitType.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm.value && (
                <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h3 class="text-lg font-bold mb-4">Confirmar Eliminación</h3>
                        <p class="text-gray-600 mb-6">
                            ¿Está seguro que desea eliminar este tipo de fruto? Esta acción marcará el tipo como eliminado.
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
