import { component$ } from '@builder.io/qwik';
import { routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { users, auditLogs } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const useCreateUser = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string; role: string } | undefined;
    if (!session || session.role !== 'admin') throw redirect(302, '/dashboard');

    const { username, password, fullName, role } = data;

    // Check if username exists
    const existing = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

    if (existing.length > 0) {
        return {
            success: false,
            message: "El nombre de usuario ya existe"
        };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.insert(users).values({
        username,
        passwordHash,
        fullName,
        role: role as 'admin' | 'operator',
        isActive: true,
        createdBy: session.id,
    }).returning();

    // Log audit
    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'create_user',
        tableName: 'users',
        recordId: newUser[0].id,
        newValues: { username, fullName, role },
    });

    throw redirect(302, '/dashboard/users');
}, zod$({
    username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    fullName: z.string().min(1, "El nombre completo es requerido"),
    role: z.enum(['admin', 'operator']),
}));

export default component$(() => {
    const createAction = useCreateUser();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Nuevo Usuario</h2>
                    <p class="text-sm text-gray-500 mt-1">Registre un nuevo usuario en el sistema</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl">
                <div class="p-6">
                    <Form action={createAction} class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="username">Usuario *</label>
                            <input type="text" name="username" required placeholder="nombre.usuario" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            {createAction.value?.fieldErrors?.username && <p class="text-sm text-red-500">{createAction.value.fieldErrors.username}</p>}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="password">Contraseña *</label>
                            <input type="password" name="password" required placeholder="******" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            {createAction.value?.fieldErrors?.password && <p class="text-sm text-red-500">{createAction.value.fieldErrors.password}</p>}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="fullName">Nombre Completo *</label>
                            <input type="text" name="fullName" required placeholder="Juan Pérez" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            {createAction.value?.fieldErrors?.fullName && <p class="text-sm text-red-500">{createAction.value.fieldErrors.fullName}</p>}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="role">Rol *</label>
                            <select name="role" required class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="operator">Operador</option>
                                <option value="admin">Administrador</option>
                            </select>
                            {createAction.value?.fieldErrors?.role && <p class="text-sm text-red-500">{createAction.value.fieldErrors.role}</p>}
                        </div>

                        {createAction.value?.failed && (
                            <div class="p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                                <span class="font-medium">Error:</span> {createAction.value.message}
                            </div>
                        )}

                        <div class="flex justify-end gap-4">
                            <button type="button" onClick$={() => history.back()} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                Cancelar
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                Crear Usuario
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
