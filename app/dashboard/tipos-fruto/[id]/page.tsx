import { getFruitType } from "@/lib/actions/fruit-types"
import { notFound, redirect } from "next/navigation"
import { EditFruitTypeForm } from "@/components/edit-fruit-type-form"

export default async function EditFruitTypePage({ params }: { params: { id: string } }) {
  const { id } = await params

  if (id === "new") {
    redirect("/dashboard/tipos-fruto")
  }

  try {
    const fruitType = await getFruitType(id)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Tipo de Fruto</h1>
          <p className="text-muted-foreground">Actualice la información del tipo de fruto</p>
        </div>

        <EditFruitTypeForm fruitType={fruitType} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
