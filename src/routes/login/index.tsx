import { component$ } from '@builder.io/qwik';
import { routeAction$, Form, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { users, auditLogs } from '~/lib/db/schema';
import { verifyPassword } from '~/lib/auth';
import { eq, sql } from 'drizzle-orm';

export const useLogin = routeAction$(async (data, { cookie, redirect }) => {
    const { username, password } = data;

    // Database logic
    const userData = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = userData[0];

    if (!user) {
        // Check setup needed
        const allUsers = await db.select({ count: sql`count(*)` }).from(users);
        if (Number(allUsers[0].count) === 0) {
            throw redirect(302, '/setup');
        }
        return { success: false, message: 'Usuario o contraseña incorrectos' };
    }

    if (!user.isActive) {
        return { success: false, message: 'Usuario inactivo. Contacte al administrador.' };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        return { success: false, message: 'Usuario o contraseña incorrectos' };
    }

    // Set cookie
    cookie.set('user_session', JSON.stringify({
        id: user.id,
        username: user.username,
        role: user.role,
    }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: [8, 'hours'],
    });

    // Log
    await db.insert(auditLogs).values({
        userId: user.id,
        action: "login",
        tableName: "users",
        recordId: user.id,
    });

    throw redirect(302, '/dashboard');
}, zod$({
    username: z.string(),
    password: z.string(),
}));

export default component$(() => {
    const loginAction = useLogin();

    return (
        <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
            <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <div class="space-y-1 mb-6">
                    <h1 class="text-2xl font-bold text-center text-gray-900">Sistema de Recepción de Frutos</h1>
                    <p class="text-center text-gray-500">Ingrese sus credenciales para acceder</p>
                </div>

                <Form action={loginAction} class="space-y-4">
                    <div class="space-y-2">
                        <label for="username" class="block text-sm font-medium text-gray-700">Usuario</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Ingrese su usuario"
                            class="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        />
                    </div>
                    <div class="space-y-2">
                        <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Ingrese su contraseña"
                            class="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        />
                    </div>

                    {loginAction.value?.success === false && (
                        <div class="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                            {loginAction.value.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2 w-full"
                        disabled={loginAction.isRunning}
                    >
                        {loginAction.isRunning ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </Form>
            </div>
        </div>
    );
});
