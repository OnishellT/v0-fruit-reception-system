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
  try {
    const [providersResult, driversData, fruitTypesData] = await Promise.all([
      getProviders(),
      getDrivers(),
      getFruitTypes(),
    ]);

    if (providersResult.error) {
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

    const providers = providersResult.data || [];
    const drivers = driversData || [];
    const fruitTypes = fruitTypesData || [];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Recepción</h1>
          <p className="text-muted-foreground mt-2">
            Complete el formulario para registrar una nueva recepción de frutos
          </p>
        </div>

        <ReceptionFormWrapper
          providers={providers}
          drivers={drivers}
          fruitTypes={fruitTypes}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading reception form data:", error);
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
}
