"use server";

import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { getSession } from "@/lib/actions/auth";
import { eq, desc, inArray, or, sql, and } from "drizzle-orm";

interface PricingChange {
  fruit_type: string;
  action: "create" | "update" | "delete";
  changes: Array<{
    field: string;
    old_value: any;
    new_value: any;
  }>;
}

/**
 * Log pricing rule changes to audit trail
 */
export async function logPricingChange(change: PricingChange) {
  const session = await getSession();
  if (!session?.id) {
    console.warn("Cannot log pricing change: no user session");
    return;
  }

  try {
    // Create detailed change description
    const changeDescription = change.changes
      .map(c => `${c.field}: ${c.old_value} → ${c.new_value}`)
      .join(", ");

    await db.insert(auditLogs).values({
      userId: session.id,
      action: `pricing_${change.action}`,
      tableName: change.action === "create" ? "discount_thresholds" :
                 change.action === "update" ? "pricing_rules" : "discount_thresholds",
      recordId: change.fruit_type, // Using fruit_type as record identifier
      oldValues: change.action !== "create" ? change.changes.reduce((acc, c) => {
        acc[c.field] = c.old_value;
        return acc;
      }, {} as Record<string, any>) : null,
      newValues: {
        fruit_type: change.fruit_type,
        action: change.action,
        changes: change.changes,
        description: changeDescription
      }
    });
  } catch (error) {
    console.error("Error logging pricing change:", error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * Get pricing change history for a fruit type
 */
export async function getPricingChangeHistory(fruitType: string, limit: number = 50) {
  try {
    const data = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
        createdAt: auditLogs.createdAt,
        user: {
          username: users.username,
        },
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(
        and(
          inArray(auditLogs.action, ["pricing_create", "pricing_update", "pricing_delete"]),
          or(
            sql`${auditLogs.oldValues}->>'fruit_type' = ${fruitType}`,
            sql`${auditLogs.newValues}->>'fruit_type' = ${fruitType}`
          )
        )
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    // Transform the data to a more usable format
    const changes = data.map(log => {
      const newValues = log.newValues as any;
      const changes = newValues?.changes || [];
      return {
        id: log.id,
        fruit_type: newValues?.fruit_type || fruitType,
        action: log.action.replace("pricing_", "") as "create" | "update" | "delete",
        changes: changes,
        user: log.user,
        created_at: log.createdAt
      };
    });

    return { data: changes };
  } catch (error) {
    console.error("Error fetching pricing change history:", error);
    return { error: "Error al obtener el historial de cambios" };
  }
}
