import type React from "react"
import { getSession } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { DashboardProviderWrapper } from "@/components/dashboard-provider-wrapper"
import { Users, Package, LayoutDashboard, FileText, Truck, UserCircle, Apple, Building2 } from "lucide-react"
import Link from "next/link"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <DashboardProviderWrapper>
      <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Sistema de Recepción</h1>
            <p className="text-sm text-muted-foreground mt-1">{session.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{session.role}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2 text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Inicio</span>
            </Link>
            <Link
              href="/dashboard/reception"
              className="flex items-center gap-3 px-4 py-2 text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              <Package className="h-5 w-5" />
              <span>Recepción de Frutos</span>
            </Link>

            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Datos Maestros
              </p>
            </div>
            <Link
              href="/dashboard/proveedores"
              className="flex items-center gap-3 px-4 py-2 text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              <Truck className="h-5 w-5" />
              <span>Proveedores</span>
            </Link>
            <Link
              href="/dashboard/choferes"
              className="flex items-center gap-3 px-4 py-2 text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              <UserCircle className="h-5 w-5" />
              <span>Choferes</span>
            </Link>
            {session.role === "admin" && (
              <Link
                href="/dashboard/asociaciones"
                className="flex items-center gap-3 px-4 py-2 text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                <Building2 className="h-5 w-5" />
                <span>Asociaciones</span>
              </Link>
            )}
            {session.role === "admin" && (
              <Link
                href="/dashboard/tipos-fruto"
                className="flex items-center gap-3 px-4 py-2 text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                <Apple className="h-5 w-5" />
                <span>Tipos de Fruto</span>
              </Link>
            )}

            {session.role === "admin" && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Administración
                  </p>
                </div>
                <Link
                  href="/dashboard/users"
                  className="flex items-center gap-3 px-4 py-2 text-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  <Users className="h-5 w-5" />
                  <span>Gestión de Usuarios</span>
                </Link>
                <Link
                  href="/dashboard/audit"
                  className="flex items-center gap-3 px-4 py-2 text-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  <span>Auditoría</span>
                </Link>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <LogoutButton />
          </div>
        </div>
      </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </DashboardProviderWrapper>
  )
}
