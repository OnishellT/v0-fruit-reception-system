import { getSession } from "@/lib/actions/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardStats } from "@/components/dashboard-stats"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">No autorizado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {session?.username}</h1>
        <p className="text-gray-600 mt-2">Panel de control del sistema de recepción de frutos</p>
      </div>

      <DashboardStats />

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede a las funciones principales del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <a
            href="/dashboard/reception"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Nueva Recepción</h3>
            <p className="text-sm text-gray-600 mt-1">Registrar una nueva pesada de frutos</p>
          </a>
          {session?.role === "admin" && (
            <a
              href="/dashboard/users"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">Gestionar Usuarios</h3>
              <p className="text-sm text-gray-600 mt-1">Crear y administrar usuarios del sistema</p>
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
