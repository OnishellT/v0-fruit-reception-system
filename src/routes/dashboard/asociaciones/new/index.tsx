import { component$ } from '@builder.io/qwik';
import { routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { asociaciones } from '~/lib/db/schema';

export const useCreateAsociacion = routeAction$(async (data, { cookie, redirect }) => {
    const session = cookie.get('user_session')?.json();
    if (!session) throw redirect(302, '/login');

    const { code, name, description } = data;

    await db.insert(asociaciones).values({
        code,
        name,
        description,
    });

    throw redirect(302, '/dashboard/asociaciones');
}, zod$({
    code: z.string().min(1, "El código es requerido"),
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
}));

export default component$(() => {
    const createAction = useCreateAsociacion();

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Nueva Asociación</h2>
                    <p class="text-sm text-gray-500 mt-1">Registre una nueva asociación</p>
                </div>
            </div>

            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div class="p-6">
                    <Form action={createAction} class="space-y-6">
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="code">Código *</label>
                                <input type="text" name="code" required placeholder="Ej: ASOC-001" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                                {createAction.value?.fieldErrors?.code && <p class="text-sm text-red-500">{createAction.value.fieldErrors.code}</p>}
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">Nombre *</label>
                                <input type="text" name="name" required placeholder="Nombre de la asociación" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                                {createAction.value?.fieldErrors?.name && <p class="text-sm text-red-500">{createAction.value.fieldErrors.name}</p>}
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="description">Descripción</label>
                            <textarea name="description" rows={3} placeholder="Descripción de la asociación" class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></textarea>
                        </div>

                        <div class="flex justify-end gap-4">
                            <button type="button" onClick$={() => history.back()} class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                Cancelar
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                Guardar Asociación
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});
