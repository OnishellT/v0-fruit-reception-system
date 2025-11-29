import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { receptions, cashReceptions, fruitTypes, cashFruitTypes, cashCustomers, pricingCalculations } from '~/lib/db/schema';
import { sql, desc, and, gte, lte, count, sum, eq } from 'drizzle-orm';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { DashboardStats } from '~/components/dashboard/dashboard-stats';
import { WeightByFruitChart } from '../../components/dashboard/charts/weight-by-fruit-chart';
import { PriceTrendChart } from '../../components/dashboard/charts/price-trend-chart';
export const useDashboardMetrics = routeLoader$(async ({ cookie, redirect }) => {
    const session = cookie.get('user_session')?.json() as { id: string, role: string, username: string } | undefined;
    if (!session) throw redirect(302, '/login');

    try {
        const today = new Date();
        // Create date ranges in UTC to match database timestamps
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const todayStart = startOfDay(todayUTC);
        const todayEnd = endOfDay(todayUTC);
        const weekStart = startOfDay(subDays(todayUTC, 6));
        const monthStart = startOfDay(subDays(todayUTC, 29));

        // Today's metrics
        const regularToday = await db
            .select({
                count: count(),
                totalWeight: sum(receptions.totalPesoOriginal),
                totalRevenue: sum(pricingCalculations.finalTotal),
            })
            .from(receptions)
            .leftJoin(pricingCalculations, eq(receptions.pricingCalculationId, pricingCalculations.id))
            .where(sql`${receptions.receptionDate} = CURRENT_DATE`);

        const cashToday = await db
            .select({
                count: count(),
                totalWeight: sum(cashReceptions.totalWeightKgOriginal),
                totalRevenue: sum(cashReceptions.netAmount),
            })
            .from(cashReceptions)
            .where(and(
                gte(cashReceptions.receptionDate, todayStart),
                lte(cashReceptions.receptionDate, todayEnd)
            ));

        // Weekly metrics
        const regularWeekly = await db
            .select({
                count: count(),
                totalWeight: sum(receptions.totalPesoOriginal),
                totalRevenue: sum(pricingCalculations.finalTotal),
            })
            .from(receptions)
            .leftJoin(pricingCalculations, eq(receptions.pricingCalculationId, pricingCalculations.id))
            .where(sql`${receptions.receptionDate} >= CURRENT_DATE - INTERVAL '6 days'`);

        const cashWeekly = await db
            .select({
                count: count(),
                totalWeight: sum(cashReceptions.totalWeightKgOriginal),
                totalRevenue: sum(cashReceptions.netAmount),
            })
            .from(cashReceptions)
            .where(gte(cashReceptions.receptionDate, weekStart));

        // Monthly metrics
        const regularMonthly = await db
            .select({
                count: count(),
                totalWeight: sum(receptions.totalPesoOriginal),
                totalRevenue: sum(pricingCalculations.finalTotal),
            })
            .from(receptions)
            .leftJoin(pricingCalculations, eq(receptions.pricingCalculationId, pricingCalculations.id))
            .where(sql`${receptions.receptionDate} >= CURRENT_DATE - INTERVAL '29 days'`);

        const cashMonthly = await db
            .select({
                count: count(),
                totalWeight: sum(cashReceptions.totalWeightKgOriginal),
                totalRevenue: sum(cashReceptions.netAmount),
            })
            .from(cashReceptions)
            .where(gte(cashReceptions.receptionDate, monthStart));

        // Top fruit types
        const regularFruitTypesData = await db
            .select({
                name: fruitTypes.type,
                totalWeight: sum(receptions.totalPesoOriginal),
            })
            .from(receptions)
            .innerJoin(fruitTypes, eq(receptions.fruitTypeId, fruitTypes.id))
            .where(sql`${receptions.receptionDate} >= CURRENT_DATE - INTERVAL '29 days'`)
            .groupBy(fruitTypes.type)
            .orderBy(desc(sum(receptions.totalPesoOriginal)))
            .limit(5);

        const cashFruitTypesData = await db
            .select({
                name: cashFruitTypes.name,
                totalWeight: sum(cashReceptions.totalWeightKgOriginal),
            })
            .from(cashReceptions)
            .innerJoin(cashFruitTypes, eq(cashReceptions.fruitTypeId, cashFruitTypes.id))
            .where(gte(cashReceptions.receptionDate, monthStart))
            .groupBy(cashFruitTypes.name)
            .orderBy(desc(sum(cashReceptions.totalWeightKgOriginal)))
            .limit(5);

        // Recent activity
        const recentRegular = await db
            .select({
                id: receptions.id,
                fruitType: fruitTypes.type,
                customer: sql<string>`'Proveedor'`,
                weight: receptions.totalPesoOriginal,
                revenue: pricingCalculations.finalTotal,
                createdAt: receptions.createdAt,
            })
            .from(receptions)
            .innerJoin(fruitTypes, eq(receptions.fruitTypeId, fruitTypes.id))
            .leftJoin(pricingCalculations, eq(receptions.pricingCalculationId, pricingCalculations.id))
            .orderBy(desc(receptions.createdAt))
            .limit(5);

        const recentCash = await db
            .select({
                id: cashReceptions.id,
                fruitType: cashFruitTypes.name,
                customer: cashCustomers.name,
                weight: cashReceptions.totalWeightKgOriginal,
                revenue: cashReceptions.netAmount,
                createdAt: cashReceptions.createdAt,
            })
            .from(cashReceptions)
            .innerJoin(cashFruitTypes, eq(cashReceptions.fruitTypeId, cashFruitTypes.id))
            .innerJoin(cashCustomers, eq(cashReceptions.customerId, cashCustomers.id))
            .orderBy(desc(cashReceptions.createdAt))
            .limit(5);

        // Combine and sort recent activity
        const recentActivity = [
            ...recentRegular.map((item) => ({
                id: item.id,
                type: 'regular' as const,
                fruitType: item.fruitType,
                customer: item.customer,
                weight: Number(item.weight),
                revenue: Number(item.revenue),
                createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
            })),
            ...recentCash.map((item) => ({
                id: item.id,
                type: 'cash' as const,
                fruitType: item.fruitType,
                customer: item.customer,
                weight: Number(item.weight),
                revenue: Number(item.revenue),
                createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
            })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

        // Combine fruit types data
        const fruitTypeMap = new Map<string, {
            name: string;
            regularWeight: number;
            cashWeight: number;
            totalWeight: number;
        }>();

        regularFruitTypesData.forEach((item) => {
            if (item.name) {
                fruitTypeMap.set(item.name, {
                    name: item.name,
                    regularWeight: Number(item.totalWeight) || 0,
                    cashWeight: 0,
                    totalWeight: Number(item.totalWeight) || 0,
                });
            }
        });

        cashFruitTypesData.forEach((item) => {
            const existing = fruitTypeMap.get(item.name);
            if (existing) {
                existing.cashWeight = Number(item.totalWeight) || 0;
                existing.totalWeight += Number(item.totalWeight) || 0;
            } else {
                fruitTypeMap.set(item.name, {
                    name: item.name,
                    regularWeight: 0,
                    cashWeight: Number(item.totalWeight) || 0,
                    totalWeight: Number(item.totalWeight) || 0,
                });
            }
        });

        const topFruitTypes = Array.from(fruitTypeMap.values())
            .sort((a, b) => b.totalWeight - a.totalWeight)
            .slice(0, 5);

        // Price trends (last 30 days)
        const priceTrendsData = await db
            .select({
                date: receptions.receptionDate,
                totalRevenue: sum(pricingCalculations.finalTotal),
                totalWeight: sum(pricingCalculations.totalWeight),
            })
            .from(receptions)
            .innerJoin(pricingCalculations, eq(receptions.pricingCalculationId, pricingCalculations.id))
            .where(sql`${receptions.receptionDate} >= CURRENT_DATE - INTERVAL '30 days'`)
            .groupBy(receptions.receptionDate)
            .orderBy(receptions.receptionDate);

        const priceTrends = priceTrendsData.map(d => ({
            date: d.date ? new Date(d.date).toISOString() : new Date().toISOString(),
            price: Number(d.totalWeight) > 0 ? Number(d.totalRevenue) / Number(d.totalWeight) : 0
        }));

        const weightByFruit = topFruitTypes.map(t => ({
            name: t.name,
            weight: t.totalWeight
        }));

        return {
            success: true,
            data: {
                today: {
                    regularReceptions: regularToday[0]?.count || 0,
                    cashReceptions: cashToday[0]?.count || 0,
                    totalReceptions: (regularToday[0]?.count || 0) + (cashToday[0]?.count || 0),
                    regularWeight: Number(regularToday[0]?.totalWeight) || 0,
                    cashWeight: Number(cashToday[0]?.totalWeight) || 0,
                    totalWeight: (Number(regularToday[0]?.totalWeight) || 0) + (Number(cashToday[0]?.totalWeight) || 0),
                    regularRevenue: Number(regularToday[0]?.totalRevenue) || 0,
                    cashRevenue: Number(cashToday[0]?.totalRevenue) || 0,
                    totalRevenue: (Number(regularToday[0]?.totalRevenue) || 0) + (Number(cashToday[0]?.totalRevenue) || 0),
                },
                weekly: {
                    regularReceptions: regularWeekly[0]?.count || 0,
                    cashReceptions: cashWeekly[0]?.count || 0,
                    totalReceptions: (regularWeekly[0]?.count || 0) + (cashWeekly[0]?.count || 0),
                    regularWeight: Number(regularWeekly[0]?.totalWeight) || 0,
                    cashWeight: Number(cashWeekly[0]?.totalWeight) || 0,
                    totalWeight: (Number(regularWeekly[0]?.totalWeight) || 0) + (Number(cashWeekly[0]?.totalWeight) || 0),
                    regularRevenue: Number(regularWeekly[0]?.totalRevenue) || 0,
                    cashRevenue: Number(cashWeekly[0]?.totalRevenue) || 0,
                    totalRevenue: (Number(regularWeekly[0]?.totalRevenue) || 0) + (Number(cashWeekly[0]?.totalRevenue) || 0),
                },
                monthly: {
                    regularReceptions: regularMonthly[0]?.count || 0,
                    cashReceptions: cashMonthly[0]?.count || 0,
                    totalReceptions: (regularMonthly[0]?.count || 0) + (cashMonthly[0]?.count || 0),
                    regularWeight: Number(regularMonthly[0]?.totalWeight) || 0,
                    cashWeight: Number(cashMonthly[0]?.totalWeight) || 0,
                    totalWeight: (Number(regularMonthly[0]?.totalWeight) || 0) + (Number(cashMonthly[0]?.totalWeight) || 0),
                    regularRevenue: Number(regularMonthly[0]?.totalRevenue) || 0,
                    cashRevenue: Number(cashMonthly[0]?.totalRevenue) || 0,
                    totalRevenue: (Number(regularMonthly[0]?.totalRevenue) || 0) + (Number(cashMonthly[0]?.totalRevenue) || 0),
                },
                topFruitTypes,
                recentActivity,
                weightByFruit,
                priceTrends
            },
            session
        };
    } catch (error) {
        console.error("Error getting dashboard metrics:", error);
        return {
            success: false,
            error: `Failed to load dashboard metrics: ${error instanceof Error ? error.message : String(error)}`,
            session
        };
    }
});

export default component$(() => {
    const metricsSignal = useDashboardMetrics();
    const session = metricsSignal.value.session;

    return (
        <div class="space-y-8">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Bienvenido, {session?.username}</h1>
                <p class="text-gray-500 mt-2">Panel de control del sistema de recepción de frutos</p>
            </div>

            {metricsSignal.value.success && metricsSignal.value.data && (
                <>
                    <DashboardStats initialMetrics={metricsSignal.value.data as any} />

                    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        <div class="col-span-4 rounded-lg border bg-white shadow-sm">
                            <div class="flex flex-col space-y-1.5 p-6">
                                <h3 class="text-lg font-semibold leading-none tracking-tight">Distribución de Peso por Fruto</h3>
                                <p class="text-sm text-gray-500">Total acumulado últimos 30 días</p>
                            </div>
                            <div class="p-6 pt-0">
                                <WeightByFruitChart data={metricsSignal.value.data.topFruitTypes} />
                            </div>
                        </div>
                        <div class="col-span-3 rounded-lg border bg-white shadow-sm">
                            <div class="flex flex-col space-y-1.5 p-6">
                                <h3 class="text-lg font-semibold leading-none tracking-tight">Actividad Reciente</h3>
                                <p class="text-sm text-gray-500">Últimas 10 transacciones</p>
                            </div>
                            <div class="p-6 pt-0">
                                <div class="space-y-4">
                                    {metricsSignal.value.data.recentActivity.map((activity) => (
                                        <div key={`${activity.type}-${activity.id}`} class="flex items-center justify-between">
                                            <div class="flex items-center gap-4">
                                                <div class={`h-2 w-2 rounded-full ${activity.type === 'regular' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                                <div>
                                                    <p class="text-sm font-medium leading-none">{activity.customer}</p>
                                                    <p class="text-xs text-gray-500">{activity.fruitType}</p>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <p class="text-sm font-medium">{activity.weight.toFixed(2)} kg</p>
                                                <p class="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Charts Section */}
            <div class="grid gap-6 md:grid-cols-2">
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="p-6">
                        <h3 class="font-semibold leading-none tracking-tight mb-4">Peso por Fruto</h3>
                        <WeightByFruitChart data={metricsSignal.value.data?.weightByFruit || []} />
                    </div>
                </div>
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="p-6">
                        <h3 class="font-semibold leading-none tracking-tight mb-4">Tendencia de Precios</h3>
                        <PriceTrendChart data={metricsSignal.value.data?.priceTrends || []} />
                    </div>
                </div>
            </div>

            <div class="rounded-lg border bg-white text-gray-950 shadow-sm">
                <div class="flex flex-col space-y-1.5 p-6">
                    <h3 class="text-2xl font-semibold leading-none tracking-tight">Acciones Rápidas</h3>
                    <p class="text-sm text-gray-500">Accede a las funciones principales del sistema</p>
                </div>
                <div class="p-6 pt-0 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link
                        href="/dashboard/reception"
                        class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <h3 class="font-semibold text-gray-900">Nueva Recepción</h3>
                        <p class="text-sm text-gray-500 mt-1">Registrar una nueva pesada de frutos</p>
                    </Link>

                    <Link
                        href="/dashboard/cash-pos"
                        class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <h3 class="font-semibold text-gray-900">Sistema POS</h3>
                        <p class="text-sm text-gray-500 mt-1">Gestionar ventas en efectivo</p>
                    </Link>

                    {(session?.role === "admin" || session?.role === "operator") && (
                        <Link
                            href="/dashboard/cash-pos/receptions"
                            class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <h3 class="font-semibold text-gray-900">Recepción Efectivo</h3>
                            <p class="text-sm text-gray-500 mt-1">Crear recepción rápida</p>
                        </Link>
                    )}

                    {session?.role === "admin" && (
                        <Link
                            href="/dashboard/cash-pos/pricing"
                            class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <h3 class="font-semibold text-gray-900">Configurar Precios</h3>
                            <p class="text-sm text-gray-500 mt-1">Establecer precios diarios</p>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
});
