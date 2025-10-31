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
import { ReceptionFormWrapper } from "./reception-form-wrapper";

export default async function NewReceptionPage() {
  const [providersResult, driversResult, fruitTypesResult] = await Promise.all([
    getProviders(),
    getDrivers(),
    getFruitTypes(),
  ]);

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
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva Recepción</h1>
        <p className="text-muted-foreground mt-2">
          Registre una nueva pesada de frutos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de Recepción</CardTitle>
          <CardDescription>
            Complete todos los campos requeridos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReceptionFormWrapper
            providers={providersResult.data || []}
            drivers={driversResult || []}
            fruitTypes={fruitTypesResult || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
