import { component$ } from '@builder.io/qwik';
import { routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { cashCustomers } from '~/lib/db/schema';
import { eq, or } from 'drizzle-orm';

export const useCreateCustomer = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) throw redirect(302, '/login');

    const { name, nationalId } = data;

    // Check for duplicates
    const existing = await db
        .select()
        .from(cashCustomers)
        .where(or(
            eq(cashCustomers.name, name),
            eq(cashCustomers.nationalId, nationalId)
        ))
        .limit(1);

    if (existing.length > 0) {
        return {
            success: false,
            message: "Ya existe un cliente con este nombre o cédula"
        };
    }

    await db.insert(cashCustomers).values({
        name,
        nationalId,
        createdBy: session.id,
    });

    throw redirect(302, '/dashboard/cash-pos/customers');
}, zod$({
    name: z.string().min(1, "El nombre es requerido"),
    nationalId: z.string().min(1, "La cédula es requerida"),
}));

export default component$(() => {
    const createAction = useCreateCustomer();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Nuevo Cliente</h2>
                    <p class="text-sm text-gray-500 mt-1">Registre un nuevo cliente de efectivo</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl">
                <div class="p-6">
                    <Form action={createAction} class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">Nombre Completo *</label>
                            <input type="text" name="name" required placeholder="Nombre del cliente" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            {createAction.value?.fieldErrors?.name && <p class="text-sm text-red-500">{createAction.value.fieldErrors.name}</p>}
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="nationalId">Cédula *</label>
                            <input type="text" name="nationalId" required placeholder="000-0000000-0" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                            {createAction.value?.fieldErrors?.nationalId && <p class="text-sm text-red-500">{createAction.value.fieldErrors.nationalId}</p>}
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
                                Guardar Cliente
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
