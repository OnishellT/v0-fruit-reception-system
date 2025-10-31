import { getProviders } from "@/lib/actions/providers";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Info } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProvidersTableClient from "./providers-table-client";

export default async function ProvidersPage() {
  const result = await getProviders();

  if (result.error && !result.data) {
    const needsSetup =
      result.error.includes("asociaciones") ||
      result.error.includes("relationship") ||
      result.error.includes("does not exist");

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proveedores</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de proveedores de frutos
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de Base de Datos</AlertTitle>
          <AlertDescription>
            {needsSetup ? (
              <>
                Las tablas necesarias no existen en la base de datos. Por favor,
                ejecute el script{" "}
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
          <h1 className="text-3xl font-bold text-foreground">Proveedores</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de proveedores de frutos
          </p>
        </div>
        <Link href="/dashboard/proveedores/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </Link>
      </div>

      {!result.asociacionesAvailable && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Funcionalidad Limitada</AlertTitle>
          <AlertDescription>
            La función de asociaciones no está disponible. Ejecute el script{" "}
            <code className="bg-muted px-1 py-0.5 rounded">
              setup-database-complete.ts
            </code>{" "}
            para habilitar esta característica.
          </AlertDescription>
        </Alert>
      )}

      <ProvidersTableClient
        providers={result.data || []}
        showAsociacion={result.asociacionesAvailable}
      />
    </div>
  );
}
