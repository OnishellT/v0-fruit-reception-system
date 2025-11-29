import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, Link, routeAction$, Form, zod$, z, useLocation, useNavigate } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { receptions, providers, users, qualityEvaluations, qualityThresholds } from '~/lib/db/schema';
import { desc, eq, and, ilike, gte, lte, sql } from 'drizzle-orm';
import { PlusIcon, EyeIcon, Trash2Icon, FilterIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, FlaskConicalIcon } from 'lucide-qwik';
import { QualityEditModal } from '~/components/receptions/quality-edit-modal';
import { recalculateReceptionWeights } from '~/lib/actions/receptions/calculate-weights';

export const useProviders = routeLoader$(async () => {
    return await db.select({ id: providers.id, name: providers.name }).from(providers).orderBy(providers.name);
});

export const useUpdateQualityMetrics = routeAction$(async (data, { cookie }) => {
    const session = cookie.get('user_session')?.json() as { id: string } | undefined;
    if (!session) return { success: false, error: 'Unauthorized' };

    const { receptionId, humedad, moho, violetas } = data;

    // Check if evaluation exists
    const existing = await db.query.qualityEvaluations.findFirst({
        where: eq(qualityEvaluations.recepcionId, receptionId),
    });

    if (existing) {
        await db.update(qualityEvaluations)
            .set({
                humedad: humedad,
                moho: moho,
                violetas: violetas,
                updatedBy: session.id,
                updatedAt: new Date(),
            })
            .where(eq(qualityEvaluations.id, existing.id));
    } else {
        await db.insert(qualityEvaluations).values({
            recepcionId: receptionId,
            humedad: humedad,
            moho: moho,
            violetas: violetas,
            createdBy: session.id,
            updatedBy: session.id,
        });
    }

    // Trigger weight recalculation to update discounts
    await recalculateReceptionWeights(receptionId);

    return { success: true };
}, zod$({
    receptionId: z.string(),
    humedad: z.string().optional(),
    moho: z.string().optional(),
    violetas: z.string().optional(),
}));

export const useReceptions = routeLoader$(async ({ url }) => {
    try {
        const page = Number(url.searchParams.get('page')) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const status = url.searchParams.get('status');
        const providerId = url.searchParams.get('providerId');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const search = url.searchParams.get('search');

        const conditions = [];

        if (status) conditions.push(eq(receptions.status, status));
        if (providerId) conditions.push(eq(receptions.providerId, providerId));
        if (startDate) conditions.push(gte(receptions.receptionDate, startDate));
        if (endDate) conditions.push(lte(receptions.receptionDate, endDate));
        if (search) conditions.push(ilike(receptions.receptionNumber, `%${search}%`));

        // Get total count for pagination
        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(receptions)
            .where(and(...conditions));

        const totalCount = Number(countResult.count);
        const totalPages = Math.ceil(totalCount / limit);

        const data = await db
            .select({
                id: receptions.id,
                receptionNumber: receptions.receptionNumber,
                providerName: providers.name,
                truckPlate: receptions.truckPlate,
                totalWeight: receptions.totalPesoOriginal,
                totalContainers: receptions.totalContainers,
                createdAt: receptions.createdAt,
                status: receptions.status,
                userName: users.username,
                // Fetch quality metrics for initial modal values
                humedad: qualityEvaluations.humedad,
                moho: qualityEvaluations.moho,
                violetas: qualityEvaluations.violetas,
            })
            .from(receptions)
            .leftJoin(providers, eq(receptions.providerId, providers.id))
            .leftJoin(users, eq(receptions.createdBy, users.id))
            .leftJoin(qualityEvaluations, eq(receptions.id, qualityEvaluations.recepcionId))
            .where(and(...conditions))
            .orderBy(desc(receptions.createdAt))
            .limit(limit)
            .offset(offset);

        return {
            success: true,
            receptions: data,
            pagination: {
                page,
                totalPages,
                totalCount
            }
        };
    } catch (error) {
        console.error('Error fetching receptions:', error);
        return {
            success: false,
            error: `Failed to fetch receptions: ${error instanceof Error ? error.message : String(error)}`,
            receptions: [],
            pagination: { page: 1, totalPages: 1, totalCount: 0 }
        };
    }
});

export const useDeleteReception = routeAction$(async ({ id }, { redirect }) => {
    await db
        .update(receptions)
        .set({ status: 'cancelled' })
        .where(eq(receptions.id, id));

    throw redirect(302, '/dashboard/reception');
}, zod$({
    id: z.string(),
}));

export default component$(() => {
    const receptionsSignal = useReceptions();
    const providersSignal = useProviders();
    const deleteAction = useDeleteReception();
    const updateQualityAction = useUpdateQualityMetrics();
    const loc = useLocation();
    const nav = useNavigate();

    // Modal state
    const isQualityModalOpen = useSignal(false);
    const selectedReception = useSignal<any>(null);

    // Filter state
    const filters = useSignal({
        status: loc.url.searchParams.get('status') || '',
        providerId: loc.url.searchParams.get('providerId') || '',
        startDate: loc.url.searchParams.get('startDate') || '',
        endDate: loc.url.searchParams.get('endDate') || '',
        search: loc.url.searchParams.get('search') || '',
    });

    const applyFilters = $(() => {
        const params = new URLSearchParams();
        if (filters.value.status) params.set('status', filters.value.status);
        if (filters.value.providerId) params.set('providerId', filters.value.providerId);
        if (filters.value.startDate) params.set('startDate', filters.value.startDate);
        if (filters.value.endDate) params.set('endDate', filters.value.endDate);
        if (filters.value.search) params.set('search', filters.value.search);
        params.set('page', '1'); // Reset to page 1 on filter change
        nav(`/dashboard/reception?${params.toString()}`);
    });

    const clearFilters = $(() => {
        filters.value = { status: '', providerId: '', startDate: '', endDate: '', search: '' };
        nav('/dashboard/reception');
    });

    const changePage = $((newPage: number) => {
        const params = new URLSearchParams(loc.url.searchParams);
        params.set('page', newPage.toString());
        nav(`/dashboard/reception?${params.toString()}`);
    });

    return (
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">
                        Recepción de Frutos
                    </h1>
                    <p class="text-gray-500 mt-2">
                        Gestione las recepciones y pesadas de frutos
                    </p>
                </div>
                <Link href="/dashboard/reception/new" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2 gap-2">
                    <PlusIcon class="h-4 w-4" />
                    Nueva Recepción
                </Link>
            </div>

            {/* Filters */}
            <div class="bg-white rounded-lg border shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div class="space-y-2">
                        <label class="text-sm font-medium">Buscar</label>
                        <div class="relative">
                            <SearchIcon class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="N° Recepción..."
                                value={filters.value.search}
                                onInput$={(e) => filters.value.search = (e.target as HTMLInputElement).value}
                                class="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium">Proveedor</label>
                        <select
                            value={filters.value.providerId}
                            onChange$={(e) => filters.value.providerId = (e.target as HTMLSelectElement).value}
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Todos</option>
                            {providersSignal.value.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium">Estado</label>
                        <select
                            value={filters.value.status}
                            onChange$={(e) => filters.value.status = (e.target as HTMLSelectElement).value}
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Todos</option>
                            <option value="draft">Borrador</option>
                            <option value="completed">Completada</option>
                            <option value="cancelled">Cancelada</option>
                        </select>
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium">Desde</label>
                        <input
                            type="date"
                            value={filters.value.startDate}
                            onInput$={(e) => filters.value.startDate = (e.target as HTMLInputElement).value}
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>
                    <div class="flex gap-2">
                        <button
                            onClick$={applyFilters}
                            class="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            <FilterIcon class="h-4 w-4 mr-2" />
                            Filtrar
                        </button>
                        <button
                            onClick$={clearFilters}
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg border shadow-sm">
                <div class="p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 class="text-2xl font-semibold leading-none tracking-tight">Recepciones</h3>
                        <p class="text-sm text-gray-500 mt-1">
                            Mostrando {receptionsSignal.value.receptions.length} de {receptionsSignal.value.pagination.totalCount} registros
                        </p>
                    </div>
                </div>
                <div class="p-6">
                    {receptionsSignal.value.error ? (
                        <p class="text-red-600">{receptionsSignal.value.error}</p>
                    ) : (
                        <div class="relative w-full overflow-auto">
                            <table class="w-full caption-bottom text-sm">
                                <thead class="[&_tr]:border-b">
                                    <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Número</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Proveedor</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Placa</th>
                                        <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Peso (kg)</th>
                                        <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Cont.</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuario</th>
                                        <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="[&_tr:last-child]:border-0">
                                    {receptionsSignal.value.receptions.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} class="p-4 text-center text-gray-500">No se encontraron recepciones</td>
                                        </tr>
                                    ) : (
                                        receptionsSignal.value.receptions.map((reception) => (
                                            <tr key={reception.id} class="border-b transition-colors hover:bg-gray-50 data-[state=selected]:bg-muted">
                                                <td class="p-4 align-middle">
                                                    <Link href={`/dashboard/reception/${reception.id}`} class="font-medium text-blue-600 hover:underline">
                                                        {reception.receptionNumber}
                                                    </Link>
                                                </td>
                                                <td class="p-4 align-middle">{reception.providerName || 'Desconocido'}</td>
                                                <td class="p-4 align-middle">{reception.truckPlate}</td>
                                                <td class="p-4 align-middle text-right">{Number(reception.totalWeight).toFixed(2)}</td>
                                                <td class="p-4 align-middle text-right">{reception.totalContainers}</td>
                                                <td class="p-4 align-middle">{reception.createdAt ? new Date(reception.createdAt).toLocaleDateString() : '-'}</td>
                                                <td class="p-4 align-middle">
                                                    <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
                                                        ${reception.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            reception.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {reception.status === 'completed' ? 'Completada' :
                                                            reception.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                                                    </span>
                                                </td>
                                                <td class="p-4 align-middle">{reception.userName || '-'}</td>
                                                <td class="p-4 align-middle text-right">
                                                    <div class="flex justify-end gap-2">
                                                        <Link
                                                            href={`/dashboard/reception/${reception.id}`}
                                                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                            title="Ver detalle"
                                                        >
                                                            <EyeIcon class="h-4 w-4" />
                                                        </Link>

                                                        <button
                                                            onClick$={() => {
                                                                selectedReception.value = reception;
                                                                isQualityModalOpen.value = true;
                                                            }}
                                                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-blue-100 hover:text-blue-600 h-9 w-9"
                                                            title="Editar Calidad"
                                                        >
                                                            <FlaskConicalIcon class="h-4 w-4" />
                                                        </button>

                                                        <Form action={deleteAction}>
                                                            <input type="hidden" name="id" value={reception.id} />
                                                            <button
                                                                type="submit"
                                                                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-red-100 hover:text-red-600 h-9 w-9"
                                                                disabled={reception.status === 'cancelled'}
                                                                title="Cancelar Recepción"
                                                            >
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
                    )}

                    {/* Pagination */}
                    {receptionsSignal.value.pagination.totalPages > 1 && (
                        <div class="flex items-center justify-end space-x-2 py-4">
                            <button
                                onClick$={() => changePage(receptionsSignal.value.pagination.page - 1)}
                                disabled={receptionsSignal.value.pagination.page === 1}
                                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                            >
                                <ChevronLeftIcon class="h-4 w-4 mr-2" />
                                Anterior
                            </button>
                            <span class="text-sm font-medium">
                                Página {receptionsSignal.value.pagination.page} de {receptionsSignal.value.pagination.totalPages}
                            </span>
                            <button
                                onClick$={() => changePage(receptionsSignal.value.pagination.page + 1)}
                                disabled={receptionsSignal.value.pagination.page === receptionsSignal.value.pagination.totalPages}
                                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                            >
                                Siguiente
                                <ChevronRightIcon class="h-4 w-4 ml-2" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quality Edit Modal */}
            {isQualityModalOpen.value && selectedReception.value && (
                <QualityEditModal
                    receptionId={selectedReception.value.id}
                    initialValues={{
                        humedad: Number(selectedReception.value.humedad) || 0,
                        moho: Number(selectedReception.value.moho) || 0,
                        violetas: Number(selectedReception.value.violetas) || 0,
                    }}
                    onClose={$(() => {
                        isQualityModalOpen.value = false;
                        selectedReception.value = null;
                    })}
                    onSuccess={$(async (data: any) => {
                        await updateQualityAction.submit(data);
                        isQualityModalOpen.value = false;
                        selectedReception.value = null;
                        nav();
                    })}
                />
            )}
        </div>
    );
});
