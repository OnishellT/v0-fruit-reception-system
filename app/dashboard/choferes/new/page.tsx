import { CreateDriverForm } from "@/components/create-driver-form"

export default function NewDriverPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nuevo Chofer</h1>
        <p className="text-muted-foreground">Registre un nuevo chofer</p>
      </div>

      <CreateDriverForm />
    </div>
  )
}
