import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { users, auditLogs } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';

export const useUser = routeLoader$(async ({ params, cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string; role: string } | undefined;
    if (!session || session.role !== 'admin') throw redirect(302, '/dashboard');

    const user = await db
        .select({
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            role: users.role,
        })
        .from(users)
        .where(eq(users.id, params.id))
        .limit(1);

    if (user.length === 0) throw redirect(302, '/dashboard/users');

    return user[0];
});

export const useUpdateUser = routeAction$(async (data, { params, cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string; role: string } | undefined;
    if (!session || session.role !== 'admin') throw redirect(302, '/dashboard');

    const { fullName, role } = data;
    const userId = params.id;

    // Get old values
    const oldUser = await db
        .select({ fullName: users.fullName, role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    await db
        .update(users)
        .set({
            fullName,
            role: role as 'admin' | 'operator',
        })
        .where(eq(users.id, userId));

    // Log audit
    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'update_user',
        tableName: 'users',
        recordId: userId,
        oldValues: oldUser[0],
        newValues: { fullName, role },
    });

    throw redirect(302, '/dashboard/users');
}, zod$({
    fullName: z.string().min(1, "El nombre completo es requerido"),
    role: z.enum(['admin', 'operator']),
}));

export default component$(() => {
    const user = useUser();
    const updateAction = useUpdateUser();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Editar Usuario</h2>
                    <p class="text-sm text-gray-500 mt-1">Modificar datos del usuario {user.value.username}</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl">
                <div class="p-6">
                    <Form action={updateAction} class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="username">Usuario</label>
                            <input type="text" value={user.value.username} disabled class="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="fullName">Nombre Completo *</label>
                            <input type="text" name="fullName" required defaultValue={user.value.fullName} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            {updateAction.value?.fieldErrors?.fullName && <p class="text-sm text-red-500">{updateAction.value.fieldErrors.fullName}</p>}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="role">Rol *</label>
                            <select name="role" required class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="operator" selected={user.value.role === 'operator'}>Operador</option>
                                <option value="admin" selected={user.value.role === 'admin'}>Administrador</option>
                            </select>
                            {updateAction.value?.fieldErrors?.role && <p class="text-sm text-red-500">{updateAction.value.fieldErrors.role}</p>}
                        </div>

                        {updateAction.value?.failed && (
                            <div class="p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                                <span class="font-medium">Error:</span> {updateAction.value.formErrors?.[0] || 'Error al actualizar usuario'}
                            </div>
                        )}

                        <div class="flex justify-end gap-4">
                            <button type="button" onClick$={() => history.back()} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                Cancelar
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                Guardar Cambios
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
