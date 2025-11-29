import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { providers, asociaciones, auditLogs } from '~/lib/db/schema';


export const useAsociaciones = routeLoader$(async () => {
    return await db
        .select({ id: asociaciones.id, name: asociaciones.name })
        .from(asociaciones)
        .orderBy(asociaciones.name);
});

export const useCreateProvider = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const { code, name, contactPerson, phone, address, asociacionId } = data;

    const [newProvider] = await db.insert(providers).values({
        code,
        name,
        contactPerson,
        phone,
        address,
        asociacionId: asociacionId || null,
        createdBy: session.id,
    }).returning();

    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'create',
        tableName: 'providers',
        recordId: newProvider.id,
        // details: JSON.stringify({ code, name }),
    });

    throw redirect(302, '/dashboard/proveedores');
}, zod$({
    code: z.string().min(1, "El código es requerido"),
    name: z.string().min(1, "El nombre es requerido"),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    asociacionId: z.string().optional(),
}));

export default component$(() => {
    const asociacionesSignal = useAsociaciones();
    const createAction = useCreateProvider();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Nuevo Proveedor</h2>
                    <p class="text-sm text-gray-500 mt-1">Registre un nuevo proveedor de frutos</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div class="p-6">
                    <Form action={createAction} class="space-y-6">
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="code">Código *</label>
                                <input type="text" name="code" required placeholder="Ej: PROV-001" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                                {createAction.value?.fieldErrors?.code && <p class="text-sm text-red-500">{createAction.value.fieldErrors.code}</p>}
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">Nombre *</label>
                                <input type="text" name="name" required placeholder="Nombre del proveedor" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                                {createAction.value?.fieldErrors?.name && <p class="text-sm text-red-500">{createAction.value.fieldErrors.name}</p>}
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="asociacionId">Asociación</label>
                                <select name="asociacionId" class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                    <option value="">Ninguna</option>
                                    {asociacionesSignal.value.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="contactPerson">Persona de Contacto</label>
                                <input type="text" name="contactPerson" placeholder="Nombre del contacto" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="phone">Teléfono</label>
                                <input type="tel" name="phone" placeholder="Ej: 0991234567" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="address">Dirección</label>
                            <textarea name="address" rows={3} placeholder="Dirección completa" class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></textarea>
                        </div>

                        <div class="flex justify-end gap-4">
                            <button type="button" onClick$={() => history.back()} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                Cancelar
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                Guardar Proveedor
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
