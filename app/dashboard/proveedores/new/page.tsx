import { getAsociaciones } from "@/lib/actions/asociaciones";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { CreateProviderForm } from "@/components/create-provider-form";

export default async function NewProviderPage() {
  let asociaciones: any[] = [];
  let asociacionesAvailable = true;

  try {
    const result = await getAsociaciones();
    if (result.data) {
      asociaciones = result.data;
    }
  } catch (error) {
    asociacionesAvailable = false;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nuevo Proveedor</h1>
        <p className="text-muted-foreground">
          Registre un nuevo proveedor de frutos
        </p>
      </div>

      {!asociacionesAvailable && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            La función de asociaciones no está disponible. El proveedor se
            creará sin asociación.
          </AlertDescription>
        </Alert>
      )}

      <CreateProviderForm asociaciones={asociaciones} />
    </div>
  );
}
