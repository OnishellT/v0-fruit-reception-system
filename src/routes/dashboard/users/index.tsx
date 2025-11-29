import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { users, auditLogs } from '~/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { PlusIcon, PencilIcon, UserIcon, ShieldIcon } from 'lucide-qwik';

export const useUsers = routeLoader$(async ({ cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string; role: string } | undefined;
    if (!session || session.role !== 'admin') throw redirect(302, '/dashboard');

    return await db
        .select({
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            role: users.role,
            isActive: users.isActive,
            createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
});

export const useToggleUserStatus = routeAction$(async ({ id, isActive }, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string; role: string } | undefined;
    if (!session || session.role !== 'admin') throw redirect(302, '/dashboard');

    const newStatus = isActive === 'true';

    await db
        .update(users)
        .set({ isActive: newStatus })
        .where(eq(users.id, id));

    // Log audit
    await db.insert(auditLogs).values({
        userId: session.id,
        action: newStatus ? 'activate_user' : 'deactivate_user',
        tableName: 'users',
        recordId: id,
    });

    throw redirect(302, '/dashboard/users');
}, zod$({
    id: z.string(),
    isActive: z.string(),
}));

export default component$(() => {
    const usersSignal = useUsers();
    const toggleAction = useToggleUserStatus();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p class="text-gray-500 mt-1">Administre los usuarios del sistema y sus roles</p>
                </div>
                <Link href="/dashboard/users/new" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
                    <PlusIcon class="h-4 w-4" />
                    Nuevo Usuario
                </Link>
            </div>

            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <div class="relative w-full overflow-auto">
                        <table class="w-full caption-bottom text-sm">
                            <thead class="[&_tr]:border-b">
                                <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuario</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre Completo</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rol</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha Creación</th>
                                    <th class="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Estado</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="[&_tr:last-child]:border-0">
                                {usersSignal.value.map((user) => (
                                    <tr key={user.id} class="border-b transition-colors hover:bg-muted/50">
                                        <td class="p-4 align-middle font-medium">{user.username}</td>
                                        <td class="p-4 align-middle">{user.fullName}</td>
                                        <td class="p-4 align-middle">
                                            <span class={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {user.role === 'admin' ? (
                                                    <>
                                                        <ShieldIcon class="w-3 h-3 mr-1" />
                                                        Administrador
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserIcon class="w-3 h-3 mr-1" />
                                                        Operador
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td class="p-4 align-middle">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-DO') : '-'}
                                        </td>
                                        <td class="p-4 align-middle text-center">
                                            {user.isActive ? (
                                                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-800">
                                                    Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td class="p-4 align-middle text-right">
                                            <div class="flex justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/users/${user.id}`}
                                                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                >
                                                    <PencilIcon class="h-4 w-4" />
                                                </Link>

                                                <Form action={toggleAction}>
                                                    <input type="hidden" name="id" value={user.id} />
                                                    <input type="hidden" name="isActive" value={(!user.isActive).toString()} />
                                                    <button
                                                        type="submit"
                                                        class={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${user.isActive ? 'bg-red-100 text-red-900 hover:bg-red-200' : 'bg-green-100 text-green-900 hover:bg-green-200'}`}
                                                    >
                                                        {user.isActive ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </Form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
});
