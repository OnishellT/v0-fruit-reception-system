import { component$ } from '@builder.io/qwik';
import { routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { drivers, auditLogs } from '~/lib/db/schema';

export const useCreateDriver = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const { name, licenseNumber, phone } = data;

    const [newDriver] = await db.insert(drivers).values({
        name,
        licenseNumber,
        phone,
        createdBy: session.id,
    }).returning();

    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'create',
        tableName: 'drivers',
        recordId: newDriver.id,
    });

    throw redirect(302, '/dashboard/choferes');
}, zod$({
    name: z.string().min(1, "El nombre es requerido"),
    licenseNumber: z.string().optional(),
    phone: z.string().optional(),
}));

export default component$(() => {
    const createAction = useCreateDriver();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Nuevo Chofer</h2>
                    <p class="text-sm text-gray-500 mt-1">Registre un nuevo chofer</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div class="p-6">
                    <Form action={createAction} class="space-y-6">
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">Nombre *</label>
                                <input type="text" name="name" required placeholder="Nombre del chofer" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                                {createAction.value?.fieldErrors?.name && <p class="text-sm text-red-500">{createAction.value.fieldErrors.name}</p>}
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="licenseNumber">Número de Licencia</label>
                                <input type="text" name="licenseNumber" placeholder="Ej: 1234567890" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="phone">Teléfono</label>
                                <input type="tel" name="phone" placeholder="Ej: 0991234567" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            </div>
                        </div>

                        <div class="flex justify-end gap-4">
                            <button type="button" onClick$={() => history.back()} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                Cancelar
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                Guardar Chofer
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
