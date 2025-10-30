import { getDriver } from "@/lib/actions/drivers"
import { notFound, redirect } from "next/navigation"
import { EditDriverForm } from "@/components/edit-driver-form"

export default async function EditDriverPage({ params }: { params: { id: string } }) {
  const { id } = await params

  if (id === "new") {
    redirect("/dashboard/choferes")
  }

  try {
    const driver = await getDriver(id)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Chofer</h1>
          <p className="text-muted-foreground">Actualice la información del chofer</p>
        </div>

        <EditDriverForm driver={driver} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
