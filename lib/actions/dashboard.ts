import { db } from "@/lib/db";
import { sql, desc, and, gte, lte, count, sum } from "drizzle-orm";
import { receptions, cashReceptions, fruitTypes, cashFruitTypes, cashCustomers, pricingCalculations } from "@/lib/db/schema";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export interface DashboardMetrics {
  // Today's metrics
  today: {
    regularReceptions: number;
    cashReceptions: number;
    totalReceptions: number;
    regularWeight: number;
    cashWeight: number;
    totalWeight: number;
    regularRevenue: number;
    cashRevenue: number;
    totalRevenue: number;
  };

  // Weekly metrics (last 7 days)
  weekly: {
    regularReceptions: number;
    cashReceptions: number;
    totalReceptions: number;
    regularWeight: number;
    cashWeight: number;
    totalWeight: number;
    regularRevenue: number;
    cashRevenue: number;
    totalRevenue: number;
  };

  // Monthly metrics (last 30 days)
  monthly: {
    regularReceptions: number;
    cashReceptions: number;
    totalReceptions: number;
    regularWeight: number;
    cashWeight: number;
    totalWeight: number;
    regularRevenue: number;
    cashRevenue: number;
    totalRevenue: number;
  };

  // Top performers
  topFruitTypes: Array<{
    name: string;
    regularWeight: number;
    cashWeight: number;
    totalWeight: number;
  }>;

  // Recent activity
  recentActivity: Array<{
    id: number;
    type: 'regular' | 'cash';
    fruitType: string;
    customer: string;
    weight: number;
    revenue: number;
    createdAt: Date;
  }>;
}

export async function getDashboardMetrics(): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> {
  try {
    const today = new Date();
    // Create date ranges in UTC to match database timestamps
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const todayStart = startOfDay(todayUTC);
    const todayEnd = endOfDay(todayUTC);
    const weekStart = startOfDay(subDays(todayUTC, 6));
    const monthStart = startOfDay(subDays(todayUTC, 29));



    // Today's metrics - simplified
    const regularToday = await db
      .select({
        count: count(),
        totalWeight: sum(receptions.totalPesoOriginal),
        totalRevenue: sum(pricingCalculations.finalTotal),
      })
      .from(receptions)
      .leftJoin(pricingCalculations, sql`${receptions.pricingCalculationId} = ${pricingCalculations.id}`)
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

    // Weekly metrics - simplified
    const regularWeekly = await db
      .select({
        count: count(),
        totalWeight: sum(receptions.totalPesoOriginal),
        totalRevenue: sum(pricingCalculations.finalTotal),
      })
      .from(receptions)
      .leftJoin(pricingCalculations, sql`${receptions.pricingCalculationId} = ${pricingCalculations.id}`)
      .where(sql`${receptions.receptionDate} >= CURRENT_DATE - INTERVAL '6 days'`);

    const cashWeekly = await db
      .select({
        count: count(),
        totalWeight: sum(cashReceptions.totalWeightKgOriginal),
        totalRevenue: sum(cashReceptions.netAmount),
      })
      .from(cashReceptions)
      .where(gte(cashReceptions.receptionDate, weekStart));

    // Monthly metrics - simplified
    const regularMonthly = await db
      .select({
        count: count(),
        totalWeight: sum(receptions.totalPesoOriginal),
        totalRevenue: sum(pricingCalculations.finalTotal),
      })
      .from(receptions)
      .leftJoin(pricingCalculations, sql`${receptions.pricingCalculationId} = ${pricingCalculations.id}`)
      .where(sql`${receptions.receptionDate} >= CURRENT_DATE - INTERVAL '29 days'`);

    const cashMonthly = await db
      .select({
        count: count(),
        totalWeight: sum(cashReceptions.totalWeightKgOriginal),
        totalRevenue: sum(cashReceptions.netAmount),
      })
      .from(cashReceptions)
      .where(gte(cashReceptions.receptionDate, monthStart));

    // Top fruit types - simplified
    const regularFruitTypesData = await db
      .select({
        name: fruitTypes.type,
        totalWeight: sum(receptions.totalPesoOriginal),
      })
      .from(receptions)
      .innerJoin(fruitTypes, sql`${receptions.fruitTypeId} = ${fruitTypes.id}`)
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
      .innerJoin(cashFruitTypes, sql`${cashReceptions.fruitTypeId} = ${cashFruitTypes.id}`)
      .where(gte(cashReceptions.receptionDate, monthStart))
      .groupBy(cashFruitTypes.name)
      .orderBy(desc(sum(cashReceptions.totalWeightKgOriginal)))
      .limit(5);

    // Recent activity (last 10 items)
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
      .innerJoin(fruitTypes, sql`${receptions.fruitTypeId} = ${fruitTypes.id}`)
      .leftJoin(pricingCalculations, sql`${receptions.pricingCalculationId} = ${pricingCalculations.id}`)
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
      .innerJoin(cashFruitTypes, sql`${cashReceptions.fruitTypeId} = ${cashFruitTypes.id}`)
      .innerJoin(cashCustomers, sql`${cashReceptions.customerId} = ${cashCustomers.id}`)
      .orderBy(desc(cashReceptions.createdAt))
      .limit(5);

    // Combine and sort recent activity
    const recentActivity = [
      ...recentRegular.map((item: any) => ({
        id: item.id,
        type: 'regular' as const,
        fruitType: item.fruitType,
        customer: item.customer,
        weight: Number(item.weight),
        revenue: Number(item.revenue),
        createdAt: item.createdAt,
      })),
      ...recentCash.map((item: any) => ({
        id: item.id,
        type: 'cash' as const,
        fruitType: item.fruitType,
        customer: item.customer,
        weight: Number(item.weight),
        revenue: Number(item.revenue),
        createdAt: item.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);

    // Combine fruit types data
    const fruitTypeMap = new Map<string, {
      name: string;
      regularWeight: number;
      cashWeight: number;
      totalWeight: number;
    }>();

    // Add regular fruit types
    regularFruitTypesData.forEach((item: any) => {
      fruitTypeMap.set(item.name, {
        name: item.name,
        regularWeight: Number(item.totalWeight) || 0,
        cashWeight: 0,
        totalWeight: Number(item.totalWeight) || 0,
      });
    });

    // Add/merge cash fruit types
    cashFruitTypesData.forEach((item: any) => {
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

    const metrics: DashboardMetrics = {
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
    };

    return { success: true, data: metrics };
  } catch (error) {
    console.error("Error getting dashboard metrics:", error);
    return { success: false, error: "Failed to load dashboard metrics" };
  }
}