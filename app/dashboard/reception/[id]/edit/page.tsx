import { getReceptionDetails } from "@/lib/actions/reception";
import { getReceptionPricing, calculatePricingForExistingReception } from "@/lib/actions/reception-with-pricing";
import { getDiscountBreakdown } from "@/lib/actions/pricing";
import { getProviders } from "@/lib/actions/providers";
import { getDrivers } from "@/lib/actions/drivers";
import { getFruitTypes } from "@/lib/actions/fruit-types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ReceptionEditClient } from "./reception-edit-client";

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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reception">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Editar Recepción</h1>
              <p className="text-muted-foreground mt-1">Error al cargar la recepción</p>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">
            {result.error || "Recepción no encontrada"}
          </p>
        </div>
      </div>
    );
  }

  const { reception, details = [] } = result;

  // Get pricing calculation if it exists
  let pricingResult = await getReceptionPricing(id);
  let pricingCalculation = pricingResult.success ? pricingResult.data : null;

  // Always recalculate pricing on the fly using current final weight for edit form
  if (reception.total_peso_final && reception.total_peso_final > 0) {
    console.log("Recalculating pricing on the fly for edit form...");
    const autoPricingResult = await calculatePricingForExistingReception(id);
    if (autoPricingResult.success) {
      console.log("Successfully recalculated pricing for edit form");
      // Re-fetch the updated pricing calculation
      pricingResult = await getReceptionPricing(id);
      pricingCalculation = pricingResult.success ? pricingResult.data : null;
    } else {
      console.log("Failed to recalculate pricing for edit form:", autoPricingResult.error);
    }
  }

  // Get discount breakdown if it exists
  const discountResult = await getDiscountBreakdown(id);
  const discountCalculation = discountResult.success
    ? discountResult.data
    : null;

  // Get dropdown options for the client component
  const [providersResult, driversData, fruitTypesResult] = await Promise.all([
    getProviders(),
    getDrivers(),
    getFruitTypes(),
  ]);

  const providers = providersResult.error ? [] : providersResult.data || [];
  const drivers = driversData || [];
  const fruitTypes = fruitTypesResult || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reception">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editar Recepción</h1>
            <p className="text-muted-foreground mt-1">{reception.reception_number}</p>
          </div>
        </div>
      </div>

      <ReceptionEditClient
        receptionId={id}
        reception={reception}
        details={details}
        pricingCalculation={pricingCalculation}
        discountCalculation={discountCalculation}
        providers={providers}
        drivers={drivers}
        fruitTypes={fruitTypes}
      />
    </div>
  );
}


