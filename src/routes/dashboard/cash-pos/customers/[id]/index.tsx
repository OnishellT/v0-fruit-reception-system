import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashCustomers } from '~/lib/db/schema';
import { eq, or, and, ne } from 'drizzle-orm';

export const useCustomer = routeLoader$(async ({ params, redirect }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) throw redirect(302, '/dashboard/cash-pos/customers');

    const [customer] = await db
        .select()
        .from(cashCustomers)
        .where(eq(cashCustomers.id, id))
        .limit(1);

    if (!customer) throw redirect(302, '/dashboard/cash-pos/customers');

    return customer;
});

export const useUpdateCustomer = routeAction$(async (data, { params, cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const customerId = parseInt(params.id);
    const { name, nationalId } = data;

    // Check for duplicates (excluding current customer)
    const existing = await db
        .select()
        .from(cashCustomers)
        .where(
            and(
                or(
                    eq(cashCustomers.name, name),
                    eq(cashCustomers.nationalId, nationalId)
                ),
                ne(cashCustomers.id, customerId)
            )
        )
        .limit(1);

    if (existing.length > 0) {
        return {
            success: false,
            message: "Ya existe otro cliente con este nombre o cédula"
        };
    }

    await db
        .update(cashCustomers)
        .set({
            name,
            nationalId,
        })
        .where(eq(cashCustomers.id, customerId));

    throw redirect(302, '/dashboard/cash-pos/customers');
}, zod$({
    name: z.string().min(1, "El nombre es requerido"),
    nationalId: z.string().min(1, "La cédula es requerida"),
}));

export default component$(() => {
    const customerSignal = useCustomer();
    const updateAction = useUpdateCustomer();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Editar Cliente</h2>
                    <p class="text-sm text-gray-500 mt-1">Actualice la información del cliente</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl">
                <div class="p-6">
                    <Form action={updateAction} class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">Nombre Completo *</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={customerSignal.value.name}
                                placeholder="Nombre del cliente"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {updateAction.value?.fieldErrors?.name && <p class="text-sm text-red-500">{updateAction.value.fieldErrors.name}</p>}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="nationalId">Cédula *</label>
                            <input
                                type="text"
                                name="nationalId"
                                required
                                value={customerSignal.value.nationalId}
                                placeholder="000-0000000-0"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {updateAction.value?.fieldErrors?.nationalId && <p class="text-sm text-red-500">{updateAction.value.fieldErrors.nationalId}</p>}
                        </div>

                        {updateAction.value?.failed && (
                            <div class="p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                                <span class="font-medium">Error:</span> {updateAction.value.message}
                            </div>
                        )}

                        <div class="flex justify-end gap-4">
                            <button type="button" onClick$={() => history.back()} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                Cancelar
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                Actualizar Cliente
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
