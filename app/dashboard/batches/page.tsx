import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { BatchesClient } from "./batches-client";

export default async function BatchesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Procesamiento de Cacao
          </h1>
        </div>
        <p className="text-muted-foreground">
          Gestiona los lotes de secado y fermentación de cacao. Selecciona recepciones disponibles
          para crear nuevos lotes y monitorea el progreso de los procesos activos.
        </p>
      </div>

      <BatchesClient />
    </div>
  );
}