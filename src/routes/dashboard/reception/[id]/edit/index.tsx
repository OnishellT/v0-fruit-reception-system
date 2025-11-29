import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, z, zod$, Form, Link, useNavigate } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { receptions, drivers } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ArrowLeftIcon, SaveIcon } from 'lucide-qwik';

export const useReception = routeLoader$(async ({ params, status }) => {
    const [reception] = await db
        .select()
        .from(receptions)
        .where(eq(receptions.id, params.id));

    if (!reception) {
        status(404);
        return null;
    }
    return reception;
});

export const useDrivers = routeLoader$(async () => {
    return await db.select().from(drivers).orderBy(drivers.name);
});

export const useUpdateReception = routeAction$(async (data, { params, redirect }) => {
    await db.update(receptions).set({
        driverId: data.driverId,
        truckPlate: data.truckPlate,
        totalContainers: data.totalContainers,
        notes: data.notes,
    }).where(eq(receptions.id, params.id));

    throw redirect(302, `/dashboard/reception/${params.id}`);
}, zod$({
    driverId: z.string().min(1, 'Conductor requerido'),
    truckPlate: z.string().min(1, 'Placa requerida'),
    totalContainers: z.coerce.number().min(1, 'Debe haber al menos 1 contenedor'),
    notes: z.string().optional(),
}));

export default component$(() => {
    const receptionSignal = useReception();
    const driversSignal = useDrivers();
    const updateAction = useUpdateReception();
    const nav = useNavigate();

    if (!receptionSignal.value) {
        return <div class="p-6 text-red-600">Recepción no encontrada</div>;
    }

    const reception = receptionSignal.value;

    return (
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <Link href={`/dashboard/reception/${reception.id}`} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    <ArrowLeftIcon class="h-4 w-4 mr-2" />
                    Volver
                </Link>
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Editar Recepción</h1>
                    <p class="text-gray-600 mt-1">{reception.receptionNumber}</p>
                </div>
            </div>

            <div class="max-w-2xl bg-white rounded-lg border shadow-sm p-6">
                <Form action={updateAction} class="space-y-6">
                    <div class="grid gap-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="driverId">
                                Conductor
                            </label>
                            <select
                                id="driverId"
                                name="driverId"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={reception.driverId}
                            >
                                <option value="">Seleccionar conductor</option>
                                {driversSignal.value.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                            {updateAction.value?.fieldErrors?.driverId && (
                                <p class="text-sm text-red-500">{updateAction.value.fieldErrors.driverId}</p>
                            )}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="truckPlate">
                                Placa del Vehículo
                            </label>
                            <input
                                id="truckPlate"
                                name="truckPlate"
                                type="text"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={reception.truckPlate}
                            />
                            {updateAction.value?.fieldErrors?.truckPlate && (
                                <p class="text-sm text-red-500">{updateAction.value.fieldErrors.truckPlate}</p>
                            )}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="totalContainers">
                                Total Contenedores
                            </label>
                            <input
                                id="totalContainers"
                                name="totalContainers"
                                type="number"
                                min="1"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={String(reception.totalContainers)}
                            />
                            {updateAction.value?.fieldErrors?.totalContainers && (
                                <p class="text-sm text-red-500">{updateAction.value.fieldErrors.totalContainers}</p>
                            )}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="notes">
                                Notas
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={reception.notes || ''}
                            />
                        </div>
                    </div>

                    <div class="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick$={() => nav(`/dashboard/reception/${reception.id}`)}
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            Cancelar
                        </button>
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
