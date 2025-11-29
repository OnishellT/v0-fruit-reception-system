import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { drivers } from '~/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-qwik';

export const useDrivers = routeLoader$(async () => {
    const data = await db
        .select({
            id: drivers.id,
            name: drivers.name,
            licenseNumber: drivers.licenseNumber,
            phone: drivers.phone,
        })
        .from(drivers)
        .where(eq(drivers.isActive, true))
        .orderBy(desc(drivers.createdAt));

    return data;
});

export const useDeleteDriver = routeAction$(async ({ id }, { redirect }) => {
    await db
        .update(drivers)
        .set({ isActive: false })
        .where(eq(drivers.id, id));

    throw redirect(302, '/dashboard/choferes');
}, zod$({
    id: z.string(),
}));

export default component$(() => {
    const driversSignal = useDrivers();
    const deleteAction = useDeleteDriver();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Choferes</h1>
                    <p class="text-gray-500 mt-1">Gestión de choferes</p>
                </div>
                <Link href="/dashboard/choferes/new" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
                    <PlusIcon class="h-4 w-4" />
                    Nuevo Chofer
                </Link>
            </div>

            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <div class="relative w-full overflow-auto">
                        <table class="w-full caption-bottom text-sm">
                            <thead class="[&_tr]:border-b">
                                <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Licencia</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Teléfono</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="[&_tr:last-child]:border-0">
                                {driversSignal.value.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} class="p-4 text-center text-muted-foreground">
                                            No hay choferes registrados
                                        </td>
                                    </tr>
                                ) : (
                                    driversSignal.value.map((driver) => (
                                        <tr key={driver.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle font-medium">{driver.name}</td>
                                            <td class="p-4 align-middle">{driver.licenseNumber || '-'}</td>
                                            <td class="p-4 align-middle">{driver.phone || '-'}</td>
                                            <td class="p-4 align-middle text-right">
                                                <div class="flex justify-end gap-2">
                                                    <Link href={`/dashboard/choferes/${driver.id}`} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                                                        <PencilIcon class="h-4 w-4" />
                                                    </Link>

                                                    <Form action={deleteAction}>
                                                        <input type="hidden" name="id" value={driver.id} />
                                                        <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-red-100 hover:text-red-600 h-9 w-9">
                                                            <Trash2Icon class="h-4 w-4" />
                                                        </button>
                                                    </Form>
                                                </div>
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
