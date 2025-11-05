"use server"

import { db } from "@/lib/db"
import { auditLogs } from "@/lib/db/schema"
import { getSession } from "@/lib/actions/auth"
import { eq, desc, gte, count, sql, and } from "drizzle-orm"

export async function getAuditLogs(filters?: { user_id?: string; action?: string; limit?: number }) {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  try {
    let whereCondition = undefined

    if (filters?.user_id && filters?.action) {
      whereCondition = and(
        eq(auditLogs.userId, filters.user_id),
        eq(auditLogs.action, filters.action)
      )
    } else if (filters?.user_id) {
      whereCondition = eq(auditLogs.userId, filters.user_id)
    } else if (filters?.action) {
      whereCondition = eq(auditLogs.action, filters.action)
    }

    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereCondition)
      .orderBy(desc(auditLogs.createdAt))
      .limit(filters?.limit || 100)

    return { logs }
  } catch (error) {
    return { error: "Error al obtener registros de auditoría" }
  }
}

export async function getAuditStats() {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  try {
    // Get total logs count
    const totalResult = await db.select({ count: count() }).from(auditLogs)
    const totalLogs = totalResult[0]?.count || 0

    // Get logs from today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayResult = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, today))

    const todayLogs = todayResult[0]?.count || 0

    // Get unique users who performed actions today
    const activeUsersResult = await db
      .select({ userId: auditLogs.userId })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, today))

    const uniqueUsers = new Set(activeUsersResult.map((log) => log.userId)).size

    return {
      totalLogs,
      todayLogs,
      activeUsers: uniqueUsers,
    }
  } catch (error) {
    return {
      totalLogs: 0,
      todayLogs: 0,
      activeUsers: 0,
    }
  }
}
