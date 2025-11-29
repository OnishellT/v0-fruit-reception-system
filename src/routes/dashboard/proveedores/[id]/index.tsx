import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, zod$, z, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { providers, asociaciones } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ArrowLeftIcon } from 'lucide-qwik';

export const useProvider = routeLoader$(async ({ params, status }) => {
    const [provider] = await db
        .select()
        .from(providers)
        .where(eq(providers.id, params.id));

    if (!provider) {
        status(404);
        return null;
    }
    return provider;
});

export const useAsociaciones = routeLoader$(async () => {
    return await db.select().from(asociaciones).orderBy(asociaciones.name);
});

export const useUpdateProvider = routeAction$(async (data, { redirect, params }) => {
    await db.update(providers).set({
        code: data.code,
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        asociacionId: data.asociacionId || null,
        updatedAt: new Date(),
    }).where(eq(providers.id, params.id));

    throw redirect(302, '/dashboard/proveedores');
}, zod$({
    code: z.string().min(1, 'Código requerido'),
    name: z.string().min(1, 'Nombre requerido'),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    asociacionId: z.string().optional(),
}));

export default component$(() => {
    const providerSignal = useProvider();
    const asociacionesSignal = useAsociaciones();
    const updateAction = useUpdateProvider();

    if (!providerSignal.value) {
        return <div>Proveedor no encontrado</div>;
    }

    const provider = providerSignal.value;

    return (
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <Link href="/dashboard/proveedores">
                    <button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                        <ArrowLeftIcon class="h-4 w-4 mr-2" />
                        Volver
                    </button>
                </Link>
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Editar Proveedor</h1>
                    <p class="text-gray-600 mt-1">Modificar datos del proveedor</p>
                </div>
            </div>

            <div class="max-w-2xl bg-white rounded-lg border shadow-sm p-6">
                <Form action={updateAction} class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="code">
                                Código
                            </label>
                            <input
                                type="text"
                                id="code"
                                name="code"
                                value={provider.code}
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">
                                Nombre
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={provider.name}
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="asociacionId">
                            Asociación
                        </label>
                        <select
                            id="asociacionId"
                            name="asociacionId"
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Ninguna</option>
                            {asociacionesSignal.value.map((assoc) => (
                                <option key={assoc.id} value={assoc.id} selected={assoc.id === provider.asociacionId}>
                                    {assoc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="contactPerson">
                                Persona de Contacto
                            </label>
                            <input
                                type="text"
                                id="contactPerson"
                                name="contactPerson"
                                value={provider.contactPerson || ''}
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="phone">
                                Teléfono
                            </label>
                            <input
                                type="text"
                                id="phone"
                                name="phone"
                                value={provider.phone || ''}
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div class="flex justify-end pt-4">
                        <button
                            type="submit"
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
});
