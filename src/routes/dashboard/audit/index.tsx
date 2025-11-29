import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { auditLogs, users } from '~/lib/db/schema';
import { eq, desc, gte, sql } from 'drizzle-orm';
import { FileTextIcon, ActivityIcon, UsersIcon } from 'lucide-qwik';

export const useAuditData = routeLoader$(async ({ cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string; role: string } | undefined;
    if (!session || session.role !== 'admin') throw redirect(302, '/dashboard');

    // Stats
    const totalLogs = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, today));

    const activeUsers = await db
        .select({ count: sql<number>`count(distinct ${auditLogs.userId})` })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, today));

    // Logs
    const logs = await db
        .select({
            id: auditLogs.id,
            action: auditLogs.action,
            tableName: auditLogs.tableName,
            createdAt: auditLogs.createdAt,
            username: users.username,
            details: auditLogs.newValues,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);

    return {
        stats: {
            total: Number(totalLogs[0].count),
            today: Number(todayLogs[0].count),
            activeUsers: Number(activeUsers[0].count),
        },
        logs,
    };
});

export default component$(() => {
    const auditData = useAuditData();

    return (
        <div class="space-y-6">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Auditoría del Sistema</h1>
                <p class="text-gray-500 mt-1">Registro de todas las acciones realizadas en el sistema</p>
            </div>

            <div class="grid gap-6 md:grid-cols-3">
                <div class="bg-white rounded-lg border shadow-sm p-6">
                    <div class="flex flex-row items-center justify-between pb-2">
                        <h3 class="text-sm font-medium text-gray-500">Total Registros</h3>
                        <FileTextIcon class="h-4 w-4 text-gray-400" />
                    </div>
                    <div class="text-2xl font-bold">{auditData.value.stats.total}</div>
                    <p class="text-xs text-gray-500">Acciones registradas</p>
                </div>

                <div class="bg-white rounded-lg border shadow-sm p-6">
                    <div class="flex flex-row items-center justify-between pb-2">
                        <h3 class="text-sm font-medium text-gray-500">Acciones Hoy</h3>
                        <ActivityIcon class="h-4 w-4 text-gray-400" />
                    </div>
                    <div class="text-2xl font-bold">{auditData.value.stats.today}</div>
                    <p class="text-xs text-gray-500">En las últimas 24 horas</p>
                </div>

                <div class="bg-white rounded-lg border shadow-sm p-6">
                    <div class="flex flex-row items-center justify-between pb-2">
                        <h3 class="text-sm font-medium text-gray-500">Usuarios Activos Hoy</h3>
                        <UsersIcon class="h-4 w-4 text-gray-400" />
                    </div>
                    <div class="text-2xl font-bold">{auditData.value.stats.activeUsers}</div>
                    <p class="text-xs text-gray-500">Usuarios únicos</p>
                </div>
            </div>

            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <h3 class="text-lg font-semibold mb-4">Registro de Auditoría</h3>
                    <div class="relative w-full overflow-auto">
                        <table class="w-full caption-bottom text-sm">
                            <thead class="[&_tr]:border-b">
                                <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuario</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Acción</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Entidad</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Detalles</th>
                                </tr>
                            </thead>
                            <tbody class="[&_tr:last-child]:border-0">
                                {auditData.value.logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} class="p-4 text-center text-muted-foreground">
                                            No hay registros de auditoría
                                        </td>
                                    </tr>
                                ) : (
                                    auditData.value.logs.map((log) => (
                                        <tr key={log.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle whitespace-nowrap">
                                                {log.createdAt ? new Date(log.createdAt).toLocaleString('es-DO') : 'N/A'}
                                            </td>
                                            <td class="p-4 align-middle font-medium">{log.username || 'Sistema'}</td>
                                            <td class="p-4 align-middle">
                                                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-800">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td class="p-4 align-middle font-mono text-xs">{log.tableName}</td>
                                            <td class="p-4 align-middle text-xs text-gray-500 max-w-xs truncate">
                                                {JSON.stringify(log.details)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
});
