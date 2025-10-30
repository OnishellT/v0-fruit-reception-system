"use client";

import { getProviders, getDrivers, getFruitTypes } from "@/lib/actions/reception"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReceptionForm } from "@/components/reception-form"
import { useUserPreferences } from "@/hooks/use-user-preferences"

// Client component wrapper to handle layout changes
function ReceptionFormWrapper({
  providers,
  drivers,
  fruitTypes,
}: {
  providers: any[];
  drivers: any[];
  fruitTypes: any[];
}) {
  const { effectiveLayout } = useUserPreferences();
  // Force re-render when layout changes by using layout as key
  return (
    <ReceptionForm
      key={`${effectiveLayout}-new`}
      providers={providers}
      drivers={drivers}
      fruitTypes={fruitTypes}
    />
  );
}

export default async function NewReceptionPage() {
  const [providersResult, driversResult, fruitTypesResult] = await Promise.all([
    getProviders(),
    getDrivers(),
    getFruitTypes(),
  ])

  if (providersResult.error || driversResult.error || fruitTypesResult.error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Nueva Recepción</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Error al cargar datos necesarios</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if data exists
  if (!providersResult.providers || providersResult.providers.length === 0 ||
      !driversResult.drivers || driversResult.drivers.length === 0 ||
      !fruitTypesResult.fruitTypes || fruitTypesResult.fruitTypes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Nueva Recepción</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-destructive font-semibold">⚠️ Datos faltantes para crear recepciones</p>
              <div className="space-y-2 text-sm">
                <p className={providersResult.providers?.length === 0 ? "text-destructive" : "text-green-600"}>
                  {providersResult.providers?.length === 0 ? "❌ No hay proveedores. Agregue al menos uno." : "✅ Proveedores cargados"}
                </p>
                <p className={driversResult.drivers?.length === 0 ? "text-destructive" : "text-green-600"}>
                  {driversResult.drivers?.length === 0 ? "❌ No hay choferes. Agregue al menos uno." : "✅ Choferes cargados"}
                </p>
                <p className={fruitTypesResult.fruitTypes?.length === 0 ? "text-destructive" : "text-green-600"}>
                  {fruitTypesResult.fruitTypes?.length === 0 ? "❌ No hay tipos de fruto. Agregue al menos uno." : "✅ Tipos de fruto cargados"}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Para agregar datos faltantes, vaya a:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground ml-4">
                  <li><a href="/dashboard/proveedores/new" className="text-blue-600 hover:underline">Agregar Proveedor</a></li>
                  <li><a href="/dashboard/choferes/new" className="text-blue-600 hover:underline">Agregar Chofer</a></li>
                  <li><a href="/dashboard/tipos-fruto/new" className="text-blue-600 hover:underline">Agregar Tipo de Fruto</a></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva Recepción</h1>
        <p className="text-muted-foreground mt-2">Registre una nueva pesada de frutos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de Recepción</CardTitle>
          <CardDescription>Complete todos los campos requeridos</CardDescription>
        </CardHeader>
        <CardContent>
          <ReceptionFormWrapper
            providers={providersResult.providers || []}
            drivers={driversResult.drivers || []}
            fruitTypes={fruitTypesResult.fruitTypes || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
