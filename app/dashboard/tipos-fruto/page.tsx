import { getFruitTypes } from "@/lib/actions/fruit-types"
import { FruitTypesTable } from "@/components/fruit-types-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getSession } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

export default async function FruitTypesPage() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/dashboard")
  }

  const fruitTypes = await getFruitTypes()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tipos de Fruto</h1>
          <p className="text-muted-foreground mt-1">Gestión de tipos y subtipos de frutos</p>
        </div>
        <Link href="/dashboard/tipos-fruto/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tipo
          </Button>
        </Link>
      </div>

      <FruitTypesTable fruitTypes={fruitTypes} />
    </div>
  )
}
