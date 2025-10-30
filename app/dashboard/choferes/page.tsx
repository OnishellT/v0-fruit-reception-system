import { getDrivers } from "@/lib/actions/drivers"
import { DriversTable } from "@/components/drivers-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function DriversPage() {
  const drivers = await getDrivers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Choferes</h1>
          <p className="text-muted-foreground mt-1">Gestión de choferes</p>
        </div>
        <Link href="/dashboard/choferes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Chofer
          </Button>
        </Link>
      </div>

      <DriversTable drivers={drivers} />
    </div>
  )
}
