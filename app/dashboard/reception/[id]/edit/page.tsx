"use client";

import { getReceptionDetails, getProviders, getDrivers, getFruitTypes } from "@/lib/actions/reception";
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
import { useUserPreferences } from "@/hooks/use-user-preferences";

// Client component wrapper to handle layout changes
function ReceptionFormWrapper({
  providers,
  drivers,
  fruitTypes,
  reception,
  details,
}: {
  providers: any[];
  drivers: any[];
  fruitTypes: any[];
  reception: any;
  details: any[];
}) {
  const { effectiveLayout } = useUserPreferences();
  // Force re-render when layout changes by using layout as key
  return (
    <ReceptionForm
      key={`${effectiveLayout}-${reception?.id || 'new'}`}
      providers={providers}
      drivers={drivers}
      fruitTypes={fruitTypes}
      reception={reception}
      details={details}
    />
  );
}

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
        <h1 className="text-3xl font-bold text-gray-900">
          Editar Recepción
        </h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error al cargar datos necesarios</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if required data exists
  if (!providersResult.providers || providersResult.providers.length === 0 ||
      !driversResult.drivers || driversResult.drivers.length === 0 ||
      !fruitTypesResult.fruitTypes || fruitTypesResult.fruitTypes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Editar Recepción
        </h1>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-red-600 font-semibold">⚠️ Datos faltantes</p>
              <div className="space-y-2 text-sm">
                <p className={providersResult.providers?.length === 0 ? "text-red-600" : "text-green-600"}>
                  {providersResult.providers?.length === 0 ? "❌ No hay proveedores" : "✅ Proveedores cargados"}
                </p>
                <p className={driversResult.drivers?.length === 0 ? "text-red-600" : "text-green-600"}>
                  {driversResult.drivers?.length === 0 ? "❌ No hay choferes" : "✅ Choferes cargados"}
                </p>
                <p className={fruitTypesResult.fruitTypes?.length === 0 ? "text-red-600" : "text-green-600"}>
                  {fruitTypesResult.fruitTypes?.length === 0 ? "❌ No hay tipos de fruto" : "✅ Tipos de fruto cargados"}
                </p>
              </div>
            </div>
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
          <CardTitle>Datos de Recepción</CardTitle>
          <CardDescription>Modifique los campos necesarios</CardDescription>
        </CardHeader>
        <CardContent>
          <ReceptionFormWrapper
            providers={providersResult.providers || []}
            drivers={driversResult.drivers || []}
            fruitTypes={fruitTypesResult.fruitTypes || []}
            reception={reception}
            details={details?.map(d => ({
              id: d.id,
              fruit_type_id: d.fruit_type_id,
              quantity: d.quantity,
              weight_kg: d.weight_kg,
            })) || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
