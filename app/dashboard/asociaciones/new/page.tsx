import { CreateAsociacionForm } from "@/components/create-asociacion-form"

export default function NewAsociacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva Asociación</h1>
        <p className="text-muted-foreground">Registre una nueva asociación de proveedores</p>
      </div>

      <CreateAsociacionForm />
    </div>
  )
}
