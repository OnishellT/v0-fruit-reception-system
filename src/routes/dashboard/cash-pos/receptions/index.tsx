import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link, Form, routeAction$, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashReceptions, cashCustomers, cashFruitTypes } from '~/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { PlusIcon, EyeIcon, PencilIcon, Trash2Icon } from 'lucide-qwik';

export const useCashReceptions = routeLoader$(async () => {
    const data = await db
        .select({
            id: cashReceptions.id,
            receptionDate: cashReceptions.receptionDate,
            customerName: cashCustomers.name,
            customerNationalId: cashCustomers.nationalId,
            fruitTypeName: cashFruitTypes.name,
            totalWeightKgOriginal: cashReceptions.totalWeightKgOriginal,
            totalWeightKgFinal: cashReceptions.totalWeightKgFinal,
            netAmount: cashReceptions.netAmount,
            containersCount: cashReceptions.containersCount,
        })
        .from(cashReceptions)
        .innerJoin(cashCustomers, eq(cashReceptions.customerId, cashCustomers.id))
        .innerJoin(cashFruitTypes, eq(cashReceptions.fruitTypeId, cashFruitTypes.id))
        .orderBy(desc(cashReceptions.receptionDate), desc(cashReceptions.createdAt));

    return data;
});

export const useDeleteCashReception = routeAction$(async ({ id }, { redirect }) => {
    await db.delete(cashReceptions).where(eq(cashReceptions.id, parseInt(id)));
    throw redirect(302, '/dashboard/cash-pos/receptions');
}, zod$({
    id: z.string(),
}));

export default component$(() => {
    const receptionsSignal = useCashReceptions();
    const deleteAction = useDeleteCashReception();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Recepciones de Efectivo</h1>
                    <p class="text-gray-500 mt-1">Ver y gestionar todas las recepciones de fruta en efectivo</p>
                </div>
                <Link href="/dashboard/cash-pos/receptions/new" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
                    <PlusIcon class="h-4 w-4" />
                    Nueva Recepción
                </Link>
            </div>

            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6">
                    <div class="relative w-full overflow-auto">
                        <table class="w-full caption-bottom text-sm">
                            <thead class="[&_tr]:border-b">
                                <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cliente</th>
                                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fruta</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Peso Orig.</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Peso Final</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Neto</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Envases</th>
                                    <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="[&_tr:last-child]:border-0">
                                {receptionsSignal.value.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} class="p-4 text-center text-muted-foreground">
                                            No hay recepciones registradas
                                        </td>
                                    </tr>
                                ) : (
                                    receptionsSignal.value.map((reception) => (
                                        <tr key={reception.id} class="border-b transition-colors hover:bg-muted/50">
                                            <td class="p-4 align-middle">
                                                {new Date(reception.receptionDate).toLocaleDateString('es-DO')}
                                            </td>
                                            <td class="p-4 align-middle">
                                                <div>
                                                    <p class="font-medium">{reception.customerName}</p>
                                                    <p class="text-xs text-gray-500">{reception.customerNationalId}</p>
                                                </div>
                                            </td>
                                            <td class="p-4 align-middle">{reception.fruitTypeName}</td>
                                            <td class="p-4 align-middle text-right font-mono">{Number(reception.totalWeightKgOriginal).toFixed(2)} kg</td>
                                            <td class="p-4 align-middle text-right font-mono">{Number(reception.totalWeightKgFinal).toFixed(2)} kg</td>
                                            <td class="p-4 align-middle text-right font-mono font-semibold text-green-600">
                                                RD$ {Number(reception.netAmount).toFixed(2)}
                                            </td>
                                            <td class="p-4 align-middle text-right">{reception.containersCount}</td>
                                            <td class="p-4 align-middle text-right">
                                                <div class="flex justify-end gap-2">
                                                    <Link href={`/dashboard/cash-pos/receptions/${reception.id}`} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                                                        <EyeIcon class="h-4 w-4" />
                                                    </Link>
                                                    <Link href={`/dashboard/cash-pos/receptions/${reception.id}`} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                                                        <PencilIcon class="h-4 w-4" />
                                                    </Link>

                                                    <Form action={deleteAction}>
                                                        <input type="hidden" name="id" value={reception.id} />
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
