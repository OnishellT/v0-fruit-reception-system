import { CreateFruitTypeForm } from "@/components/create-fruit-type-form"

export default function NewFruitTypePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nuevo Tipo de Fruto</h1>
        <p className="text-muted-foreground">Registre un nuevo tipo de fruto</p>
      </div>

      <CreateFruitTypeForm />
    </div>
  )
}
