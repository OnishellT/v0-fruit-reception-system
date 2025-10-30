import { getProvider } from "@/lib/actions/providers";
import { getAsociaciones } from "@/lib/actions/asociaciones";
import {
  getCertifications,
  getProviderCertifications,
} from "@/lib/actions/certifications";
import { notFound, redirect } from "next/navigation";
import { EditProviderForm } from "@/components/edit-provider-form";
import { ProviderCertifications } from "@/components/provider-certifications";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function EditProviderPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  if (id === "new") {
    redirect("/dashboard/proveedores");
  }

  try {
    const provider = await getProvider(id);

    let asociaciones: any[] = [];
    let allCertifications: any[] = [];
    let providerCertifications: any[] = [];
    const missingFeatures: string[] = [];

    try {
      const result = await getAsociaciones();
      if (result.data) {
        asociaciones = result.data;
      }
    } catch (error) {
      missingFeatures.push("asociaciones");
    }

    try {
      allCertifications = await getCertifications();
      providerCertifications = await getProviderCertifications(id);
    } catch (error) {
      missingFeatures.push("certificaciones");
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Editar Proveedor
          </h1>
          <p className="text-muted-foreground">
            Actualice la información del proveedor
          </p>
        </div>

        {missingFeatures.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Algunas funciones no están disponibles:{" "}
              {missingFeatures.join(", ")}. Ejecute el script{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                setup-database-complete.ts
              </code>{" "}
              para habilitar todas las funciones.
            </AlertDescription>
          </Alert>
        )}

        <EditProviderForm provider={provider} asociaciones={asociaciones} />

        {allCertifications.length > 0 && (
          <ProviderCertifications
            providerId={id}
            certifications={providerCertifications}
            allCertifications={allCertifications}
          />
        )}
      </div>
    );
  } catch (error) {
    notFound();
  }
}
