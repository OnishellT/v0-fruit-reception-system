"use server"

import { createServiceRoleClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/actions/auth"

export async function getAuditLogs(filters?: { user_id?: string; action?: string; limit?: number }) {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  const supabase = await createServiceRoleClient()

  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters?.user_id) {
    query = query.eq("user_id", filters.user_id)
  }

  if (filters?.action) {
    query = query.eq("action", filters.action)
  }

  query = query.limit(filters?.limit || 100)

  const { data: logs, error } = await query

  if (error) {
    return { error: "Error al obtener registros de auditoría" }
  }

  return { logs }
}

export async function getAuditStats() {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return { error: "No autorizado" }
  }

  const supabase = await createServiceRoleClient()

  // Get total logs count
  const { count: totalLogs } = await supabase.from("audit_logs").select("*", { count: "exact", head: true })

  // Get logs from today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: todayLogs } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString())

  // Get unique users who performed actions today
  const { data: activeUsers } = await supabase
    .from("audit_logs")
    .select("user_id")
    .gte("created_at", today.toISOString())

  const uniqueUsers = new Set(activeUsers?.map((log) => log.user_id)).size

  return {
    totalLogs: totalLogs || 0,
    todayLogs: todayLogs || 0,
    activeUsers: uniqueUsers,
  }
}
