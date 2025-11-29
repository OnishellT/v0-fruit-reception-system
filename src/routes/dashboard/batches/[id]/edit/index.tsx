import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cacaoBatches, auditLogs } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ArrowLeftIcon, SaveIcon } from 'lucide-qwik';

export const useBatch = routeLoader$(async ({ params, status }) => {
    const [batch] = await db
        .select()
        .from(cacaoBatches)
        .where(eq(cacaoBatches.id, params.id));

    if (!batch) {
        status(404);
        return null;
    }

    return batch;
});

export const useUpdateBatch = routeAction$(async (data, { cookie, params, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const [existing] = await db
        .select()
        .from(cacaoBatches)
        .where(eq(cacaoBatches.id, params.id));

    if (!existing) throw redirect(302, '/dashboard/batches');

    const updateData = {
        batchType: data.batchType,
        startDate: new Date(data.startDate),
        duration: parseInt(data.duration),
    };

    await db.update(cacaoBatches)
        .set(updateData)
        .where(eq(cacaoBatches.id, params.id));

    await db.insert(auditLogs).values({
        userId: session.id,
        action: 'update',
        tableName: 'cacao_batches',
        recordId: params.id,
        oldValues: existing,
        newValues: updateData,
    });

    throw redirect(302, `/dashboard/batches/${params.id}`);
}, zod$({
    batchType: z.string(),
    startDate: z.string(),
    duration: z.string(),
}));

export default component$(() => {
    const batchSignal = useBatch();
    const updateBatchAction = useUpdateBatch();

    if (!batchSignal.value) {
        return <div class="p-6 text-red-600">Lote no encontrado</div>;
    }

    const batch = batchSignal.value;

    return (
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <Link href={`/dashboard/batches/${batch.id}`} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    <ArrowLeftIcon class="h-4 w-4 mr-2" />
                    Cancelar
                </Link>
                <h1 class="text-3xl font-bold text-gray-900">Editar Lote</h1>
            </div>

            <div class="bg-white rounded-lg border shadow-sm p-6 max-w-2xl">
                <Form action={updateBatchAction} class="space-y-6">
                    <div class="grid gap-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="batchType">
                                Tipo de Lote
                            </label>
                            <select
                                id="batchType"
                                name="batchType"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={batch.batchType}
                            >
                                <option value="Drying">Secado</option>
                                <option value="Fermentation">Fermentación</option>
                                <option value="Fermentation + Drying">Fermentación + Secado</option>
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="startDate">
                                Fecha de Inicio
                            </label>
                            <input
                                id="startDate"
                                name="startDate"
                                type="datetime-local"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={new Date(batch.startDate).toISOString().slice(0, 16)}
                            />
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="duration">
                                Duración (días)
                            </label>
                            <input
                                id="duration"
                                name="duration"
                                type="number"
                                min="1"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={batch.duration}
                            />
                        </div>
                    </div>

                    <div class="flex justify-end gap-4">
                        <Link
                            href={`/dashboard/batches/${batch.id}`}
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            <SaveIcon class="h-4 w-4 mr-2" />
                            Guardar Cambios
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
});
