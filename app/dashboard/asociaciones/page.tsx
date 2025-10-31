import { getAsociaciones } from "@/lib/actions/asociaciones";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { CreateAsociacionDialog } from "@/components/create-asociacion-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AsociacionesTableClient from "./asociaciones-table-client";

export default async function AsociacionesPage() {
  const result = await getAsociaciones();

  if (result.error) {
    const needsSetup =
      result.error.includes("asociaciones") || result.error.includes("table");

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asociaciones</h1>
          <p className="text-muted-foreground">
            Gestione las asociaciones de proveedores
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de Base de Datos</AlertTitle>
          <AlertDescription>
            {needsSetup ? (
              <>
                La tabla de asociaciones no existe en la base de datos. Por
                favor, ejecute el script{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  setup-database-complete.ts
                </code>{" "}
                desde la sección de Scripts para configurar la base de datos.
              </>
            ) : (
              <>Error: {result.error}</>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asociaciones</h1>
          <p className="text-muted-foreground">
            Gestione las asociaciones de proveedores
          </p>
        </div>
        <CreateAsociacionDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Asociación
          </Button>
        </CreateAsociacionDialog>
      </div>

      <AsociacionesTableClient asociaciones={result.data || []} />
    </div>
  );
}
