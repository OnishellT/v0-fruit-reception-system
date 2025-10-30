import { getSession } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getAuditLogs, getAuditStats } from "@/lib/actions/audit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuditLogsTable } from "@/components/audit-logs-table"
import { Activity, Users, FileText } from "lucide-react"

export default async function AuditPage() {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    redirect("/dashboard")
  }

  const [logsResult, statsResult] = await Promise.all([getAuditLogs(), getAuditStats()])

  if (logsResult.error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Auditoría del Sistema</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">{logsResult.error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = statsResult.error ? { totalLogs: 0, todayLogs: 0, activeUsers: 0 } : statsResult

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Auditoría del Sistema</h1>
        <p className="text-gray-600 mt-2">Registro de todas las acciones realizadas en el sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">Acciones registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Acciones Hoy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayLogs}</div>
            <p className="text-xs text-muted-foreground">En las últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos Hoy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Usuarios únicos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Auditoría</CardTitle>
          <CardDescription>Últimas 100 acciones registradas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogsTable logs={logsResult.logs || []} />
        </CardContent>
      </Card>
    </div>
  )
}
