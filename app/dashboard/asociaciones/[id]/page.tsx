import { getAsociacion } from "@/lib/actions/asociaciones"
import { notFound, redirect } from "next/navigation"
import { EditAsociacionForm } from "@/components/edit-asociacion-form"

export default async function EditAsociacionPage({ params }: { params: { id: string } }) {
  const { id } = await params

  if (id === "new") {
    redirect("/dashboard/asociaciones")
  }

  try {
    const asociacion = await getAsociacion(id)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Asociación</h1>
          <p className="text-muted-foreground">Actualice la información de la asociación</p>
        </div>

        <EditAsociacionForm asociacion={asociacion} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
