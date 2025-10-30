import { getReceptionDetails } from "@/lib/actions/reception";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EditReceptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    redirect("/dashboard/reception/new");
  }

  const result = await getReceptionDetails(id);

  if (result.error || !result.reception) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Editar Recepción
        </h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">
              {result.error || "Recepción no encontrada"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { reception } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reception">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Editar Recepción
          </h1>
          <p className="text-gray-600 mt-1">
            {reception.reception_number}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidad en Desarrollo</CardTitle>
          <CardDescription>
            La edición de recepciones estará disponible próximamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Número de Recepción</p>
            <p className="font-medium">{reception.reception_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Proveedor</p>
            <p className="font-medium">
              {reception.provider
                ? `${reception.provider.code} - ${reception.provider.name}`
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha</p>
            <p className="font-medium">
              {new Date(reception.reception_date).toLocaleDateString("es-DO")}
            </p>
          </div>
          <div className="pt-4">
            <Link href={`/dashboard/reception/${reception.id}`}>
              <Button>Ver Detalles Completos</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
