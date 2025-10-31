import {
  getReceptionDetails,
} from "@/lib/actions/reception";
import {
  getProviders,
} from "@/lib/actions/providers";
import {
  getDrivers,
} from "@/lib/actions/drivers";
import {
  getFruitTypes,
} from "@/lib/actions/fruit-types";
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
import { ReceptionForm } from "@/components/reception-form";

export default async function EditReceptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    redirect("/dashboard/reception/new");
  }

  // Get reception data
  const result = await getReceptionDetails(id);

  if (result.error || !result.reception) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Editar Recepción</h1>
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

  const { reception, details } = result;

  // Get dropdown options
  const [providersResult, driversResult, fruitTypesResult] = await Promise.all([
    getProviders(),
    getDrivers(),
    getFruitTypes(),
  ]);

  if (providersResult.error || driversResult.error || fruitTypesResult.error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Editar Recepción</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error al cargar datos necesarios</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Editar Recepción</h1>
          <p className="text-gray-600 mt-1">{reception.reception_number}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de Recepción</CardTitle>
          <CardDescription>Modifique los campos necesarios</CardDescription>
        </CardHeader>
        <CardContent>
          <ReceptionForm
            providers={providersResult.data || []}
            drivers={driversResult || []}
            fruitTypes={fruitTypesResult || []}
            reception={reception}
            details={
              details?.map((d) => ({
                id: d.id,
                fruit_type_id: d.fruit_type_id,
                quantity: d.quantity,
                weight_kg: d.weight_kg,
                line_number: d.line_number,
              })) || []
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
