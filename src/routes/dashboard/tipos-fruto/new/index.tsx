import { component$ } from '@builder.io/qwik';
import { routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { fruitTypes, auditLogs } from '~/lib/db/schema';

export const useCreateFruitType = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const { type, subtype, description } = data;

    const [newFruitType] = await db.insert(fruitTypes).values({
        type,
        subtype,
        description,
    }).returning();

    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'create',
        tableName: 'fruit_types',
        recordId: newFruitType.id,
    });

    throw redirect(302, '/dashboard/tipos-fruto');
}, zod$({
    type: z.enum(['CACAO', 'CAFÉ', 'MIEL', 'COCOS']),
    subtype: z.string().min(1, "El subtipo es requerido"),
    description: z.string().optional(),
}));

export default component$(() => {
    const createAction = useCreateFruitType();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Nuevo Tipo de Fruto</h2>
                    <p class="text-sm text-gray-500 mt-1">Registre un nuevo tipo de fruto</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div class="p-6">
                    <Form action={createAction} class="space-y-6">
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="type">Tipo *</label>
                                <select name="type" required class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                    <option value="">Seleccione un tipo</option>
                                    <option value="CACAO">CACAO</option>
                                    <option value="CAFÉ">CAFÉ</option>
                                    <option value="MIEL">MIEL</option>
                                    <option value="COCOS">COCOS</option>
                                </select>
                                {createAction.value?.fieldErrors?.type && <p class="text-sm text-red-500">{createAction.value.fieldErrors.type}</p>}
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="subtype">Subtipo *</label>
                                <input type="text" name="subtype" required placeholder="ej: Convencional" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                                {createAction.value?.fieldErrors?.subtype && <p class="text-sm text-red-500">{createAction.value.fieldErrors.subtype}</p>}
                            </div>

                            <div class="space-y-2 col-span-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="description">Descripción</label>
                                <input type="text" name="description" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            </div>
                        </div>

                        <div class="flex justify-end gap-4">
                            <button type="button" onClick$={() => history.back()} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                Cancelar
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2">
                                Crear Tipo de Fruto
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
