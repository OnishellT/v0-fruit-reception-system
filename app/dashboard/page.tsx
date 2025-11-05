import { getSession } from "@/lib/actions/auth"
import { getDashboardMetrics } from "@/lib/actions/dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardStats } from "@/components/dashboard-stats"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">No autorizado</h1>
        </div>
      </div>
    )
  }

  // Fetch dashboard metrics on the server side
  const metricsResult = await getDashboardMetrics()
  const metrics = metricsResult.success ? metricsResult.data : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bienvenido, {session?.username}</h1>
        <p className="text-muted-foreground mt-2">Panel de control del sistema de recepción de frutos</p>
      </div>

        <DashboardStats initialMetrics={metrics} />

       <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede a las funciones principales del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <a
            href="/dashboard/reception"
            className="block p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <h3 className="font-semibold text-foreground">Nueva Recepción</h3>
            <p className="text-sm text-muted-foreground mt-1">Registrar una nueva pesada de frutos</p>
          </a>

          <a
            href="/dashboard/cash-pos"
            className="block p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <h3 className="font-semibold text-foreground">Sistema POS en Efectivo</h3>
            <p className="text-sm text-muted-foreground mt-1">Gestionar ventas en efectivo con precios diarios y descuentos por calidad</p>
          </a>

          {(session?.role === "admin" || session?.role === "operator") && (
            <a
              href="/dashboard/cash-pos/receptions"
              className="block p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <h3 className="font-semibold text-foreground">Nueva Recepción en Efectivo</h3>
              <p className="text-sm text-muted-foreground mt-1">Crear recepción con cálculo automático de precios y descuentos</p>
            </a>
          )}

          {session?.role === "admin" && (
            <a
              href="/dashboard/cash-pos/pricing"
              className="block p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <h3 className="font-semibold text-foreground">Configurar Precios</h3>
              <p className="text-sm text-muted-foreground mt-1">Establecer precios diarios por tipo de fruta</p>
            </a>
          )}

          {session?.role === "admin" && (
            <a
              href="/dashboard/users"
              className="block p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <h3 className="font-semibold text-foreground">Gestionar Usuarios</h3>
              <p className="text-sm text-muted-foreground mt-1">Crear y administrar usuarios del sistema</p>
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
