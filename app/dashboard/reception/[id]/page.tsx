import { getReceptionDetails } from "@/lib/actions/reception";
import { getReceptionPricing, calculatePricingForExistingReception } from "@/lib/actions/reception-with-pricing";
import { getDiscountBreakdown } from "@/lib/actions/pricing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingDown } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import { PricingBreakdown } from "@/components/pricing-breakdown";
// import { getLaboratorySamples } from "@/lib/supabase/cacao"; // Removed import
// import { LabSamplesList } from "@/components/lab-samples-list"; // Removed import
// import { CreateLabSampleDialog } from "@/components/create-lab-sample-dialog"; // Removed import
import { LaboratorySamplesSection } from "@/components/laboratory-samples-section"; // New import

export default async function ReceptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    redirect("/dashboard/reception/new");
  }

   const result = await getReceptionDetails(id);
   // const samples = await getLaboratorySamples(id); // Removed fetch

   if (result.error || !result.reception) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Detalle de Recepción
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

  const isCacaoVerde = details?.some(
    (d) => d.fruit_type?.type === "CACAO" && d.fruit_type?.subtype === "Verde",
  );

   // Get pricing calculation if it exists
   let pricingResult = await getReceptionPricing(id);
   let pricingCalculation = pricingResult.success ? pricingResult.data : null;

   // If no pricing calculation exists, try to calculate it automatically
   if (!pricingCalculation && reception.total_peso_final && reception.total_peso_final > 0) {
     console.log("No pricing calculation found, attempting to calculate automatically...");
     const autoPricingResult = await calculatePricingForExistingReception(id);
     if (autoPricingResult.success) {
       console.log("Successfully calculated pricing automatically");
       // Re-fetch the pricing calculation
       pricingResult = await getReceptionPricing(id);
       pricingCalculation = pricingResult.success ? pricingResult.data : null;
     } else {
       console.log("Failed to calculate pricing automatically:", autoPricingResult.error);
     }
   }

   // Get discount breakdown if it exists
   const discountResult = await getDiscountBreakdown(id);
   const discountCalculation = discountResult.success
     ? discountResult.data
     : null;

  // Calculate total weight with safe checks
  const baseWeight =
    Array.isArray(details) && details.length > 0
      ? details.reduce((sum, d) => {
          const weight = Number.parseFloat(d.weight_kg?.toString() || "0");
          return sum + (isNaN(weight) ? 0 : weight);
        }, 0)
      : 0;

  // TODO: Re-enable lab sample adjustment after applying migration 23
  // const totalWeight =
  //   baseWeight -
  //   (reception.lab_sample_wet_weight || 0) +
  //   (reception.lab_sample_dried_weight || 0);

  const totalWeight = baseWeight;

  console.log("⚖️ Calculated total weight:", totalWeight);

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
            {reception.reception_number}
          </h1>
          <p className="text-gray-600 mt-1">Detalle de la recepción</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Fecha</p>
               <p className="font-medium">
                 {reception.receptionDate
                   ? new Date(reception.receptionDate).toLocaleDateString("es-DO")
                   : "Fecha no disponible"}
               </p>
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
              <p className="text-sm text-gray-600">Chofer</p>
              <p className="font-medium">{reception.driver?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Placa del Camión</p>
              <p className="font-medium">{reception.truck_plate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge
                variant={
                  reception.status === "completed"
                    ? "default"
                    : reception.status === "draft"
                      ? "secondary"
                      : "destructive"
                }
                className="capitalize"
              >
                {reception.status === "completed"
                  ? "Completada"
                  : reception.status === "draft"
                    ? "Borrador"
                    : "Cancelada"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Total Contenedores</p>
              <p className="text-2xl font-bold">{reception.total_containers}</p>
            </div>

             {/* Show weight information with three stages */}
             <div className="space-y-3">
               {/* Original Weight (Wet) */}
               <div>
                 <p className="text-sm text-gray-600">Peso Original (Húmedo)</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {Number(reception.total_peso_original || totalWeight).toFixed(2)} kg
                  </p>
               </div>

               {/* Dried Weight (only for cacao verde) */}
               {isCacaoVerde && reception.total_peso_dried && (
                 <div>
                   <p className="text-sm text-amber-600">Peso Seco (Después de Lote)</p>
                   <p className="text-lg font-semibold text-amber-700">
                     {Number(reception.total_peso_dried).toFixed(2)} kg
                   </p>
                 </div>
               )}

               {/* Quality Discounts */}
               {discountCalculation && discountCalculation.total_peso_descuento > 0 && (
                 <div>
                   <p className="text-sm text-red-600">Descuento por Calidad</p>
                   <p className="text-lg font-bold text-red-600">
                     -{Number(discountCalculation.total_peso_descuento).toFixed(2)} kg
                   </p>
                 </div>
               )}

               {/* Lab Sample Adjustment */}
               {reception.lab_sample_wet_weight || reception.lab_sample_dried_weight ? (
                 <div>
                   <p className="text-sm text-blue-600">Ajuste por Muestras de Lab</p>
                   <p className="text-lg font-bold text-blue-600">
                      {(() => {
                        const labAdj =
                          Number(reception.lab_sample_dried_weight || 0) -
                          Number(reception.lab_sample_wet_weight || 0);
                        return labAdj >= 0
                          ? "+" + labAdj.toFixed(2)
                          : labAdj.toFixed(2);
                      })()}{" "}
                     kg
                   </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Húmedo:{" "}
                      {Number(reception.lab_sample_wet_weight || 0).toFixed(2)}{" "}
                      kg, Seco:{" "}
                      {Number(reception.lab_sample_dried_weight || 0).toFixed(2)}{" "}
                      kg
                    </p>
                 </div>
               ) : null}

               {/* Final Weight */}
               <div className="border-t pt-2">
                 <p className="text-sm text-green-600 font-medium">Peso Final</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Number(reception.total_peso_final || totalWeight).toFixed(2)} kg
                  </p>
               </div>
             </div>

            <div>
              <p className="text-sm text-gray-600">Registrado por</p>
              <p className="font-medium">
                {reception.created_by_user?.username || "N/A"}
              </p>
            </div>
            {reception.notes && (
              <div>
                <p className="text-sm text-gray-600">Notas</p>
                <p className="font-medium">{reception.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de Pesada</CardTitle>
          <CardDescription>
            Registro de frutos disponibles para procesamiento (excluye muestras
            de laboratorio)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>#</TableHead>
                 <TableHead>Tipo de Fruto</TableHead>
                 <TableHead>Subtipo</TableHead>
                 <TableHead className="text-right">Cantidad</TableHead>
                 <TableHead className="text-right">Peso Original (kg)</TableHead>
                 {isCacaoVerde && <TableHead className="text-right">Peso Seco (kg)</TableHead>}
                 <TableHead className="text-right">Desc. Calidad (kg)</TableHead>
                 <TableHead className="text-right">Ajuste Lab (kg)</TableHead>
                 <TableHead className="text-right">Peso Final (kg)</TableHead>
                 <TableHead className="text-right">Desc. Total (%)</TableHead>
               </TableRow>
             </TableHeader>
            <TableBody>
              {details?.map((detail) => {
                const originalWeight = Number.parseFloat(
                  detail.original_weight?.toString() ||
                    detail.weight_kg?.toString() ||
                    "0",
                );
                const discountedWeight = Number.parseFloat(
                  detail.discounted_weight?.toString() || "0",
                );
                 const labSampleAdjustment = 0; // Will be calculated from lab samples
                const finalWeight = discountedWeight + labSampleAdjustment;
                const qualityDiscount = originalWeight - discountedWeight;
                const hasDiscount =
                  detail.discount_percentage && detail.discount_percentage > 0;

                 return (
                   <TableRow key={detail.id}>
                     <TableCell>{detail.line_number}</TableCell>
                     <TableCell className="font-medium">
                       {detail.fruit_type?.type || "N/A"}
                     </TableCell>
                     <TableCell>{detail.fruit_type?.subtype || "N/A"}</TableCell>
                     <TableCell className="text-right">
                       {detail.quantity}
                     </TableCell>
                     <TableCell className="text-right font-medium">
                       {originalWeight.toFixed(2)}
                     </TableCell>
                     {isCacaoVerde && (
                       <TableCell className="text-right text-amber-600">
                         {/* Dried weight would be calculated proportionally */}
                         -
                       </TableCell>
                     )}
                     <TableCell
                       className={`text-right ${qualityDiscount > 0 ? "text-red-600" : "text-gray-400"}`}
                     >
                       {qualityDiscount.toFixed(2)}
                     </TableCell>
                     <TableCell
                       className={`text-right ${labSampleAdjustment !== 0 ? "text-blue-600" : "text-gray-400"}`}
                     >
                       {labSampleAdjustment >= 0 ? "+" : ""}
                       {labSampleAdjustment.toFixed(2)}
                     </TableCell>
                     <TableCell className="text-right font-bold text-green-600">
                       {finalWeight.toFixed(2)}
                     </TableCell>
                     <TableCell
                       className={`text-right ${hasDiscount ? "text-red-600" : "text-gray-400"}`}
                     >
                       {hasDiscount
                         ? Number(detail.discount_percentage).toFixed(1)
                         : "0.0"}
                       %
                     </TableCell>
                   </TableRow>
                 );
              })}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={3}>TOTAL DISPONIBLE</TableCell>
                 <TableCell className="text-right">
                   {reception.total_containers}
                 </TableCell>
                  <TableCell className="text-right">
                    {Number(reception.total_peso_original || 0).toFixed(2)}
                  </TableCell>
                 {isCacaoVerde && (
                    <TableCell className="text-right text-amber-600 font-bold">
                      {Number(reception.total_peso_dried || 0).toFixed(2)}
                    </TableCell>
                 )}
                  <TableCell className="text-right text-red-600 font-bold">
                    {Number(reception.total_peso_descuento || 0).toFixed(2)}
                  </TableCell>
                 <TableCell className="text-right text-blue-600 font-bold">
                    {(() => {
                      const labAdj =
                        Number(reception.lab_sample_dried_weight || 0) -
                        Number(reception.lab_sample_wet_weight || 0);
                      return labAdj >= 0
                        ? "+" + labAdj.toFixed(2)
                        : labAdj.toFixed(2);
                    })()}
                 </TableCell>
                  <TableCell className="text-right text-green-600 font-bold text-lg">
                    {Number(reception.total_peso_final || 0).toFixed(2)}
                  </TableCell>
                 <TableCell className="text-right text-red-600 font-bold">
                   {reception.total_peso_descuento
                     ? (
                         (reception.total_peso_descuento /
                           (isCacaoVerde && reception.total_peso_dried
                             ? reception.total_peso_dried
                             : (reception.total_peso_original || 1))) *
                         100
                       ).toFixed(1) + "%"
                     : "0.0%"}
                 </TableCell>
               </TableRow>
              {/* Lab Sample Information Row */}
              {/* TODO: Re-enable after applying migration 23 */}
              {/* {(reception.lab_sample_wet_weight > 0 ||
                reception.lab_sample_dried_weight > 0) && (
                <TableRow className="bg-blue-50">
                  <TableCell colSpan={3}>MUESTRAS LAB</TableCell>
                  <TableCell className="text-right">
                    {reception.lab_sample_wet_weight
                      ? Number(reception.lab_sample_wet_weight).toFixed(2)
                      : "0.00"}{" "}
                    kg húmedo
                  </TableCell>
                  <TableCell className="text-right text-blue-600 font-medium">
                    {reception.lab_sample_dried_weight
                      ? Number(reception.lab_sample_dried_weight).toFixed(2)
                      : "0.00"}{" "}
                    kg seco
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    -
                  </TableCell>
                </TableRow>
              )} */}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Laboratory Samples Card */}
      <Card>
        <CardHeader>
          <CardTitle>Muestras de Laboratorio</CardTitle>
          <CardDescription>
            {isCacaoVerde
              ? "Resultados de análisis de laboratorio para cacao"
              : "Las muestras de laboratorio solo están disponibles para recepciones de cacao verde"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCacaoVerde ? (
            <LaboratorySamplesSection receptionId={id} />
          ) : (
            <p className="text-gray-500 text-center py-4">
              No disponible para este tipo de fruto
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weight Discount Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green-600" />
            Descuentos por Calidad
          </CardTitle>
          <CardDescription>
            Información sobre descuentos aplicados por calidad del fruto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {discountCalculation &&
          discountCalculation.breakdown &&
          discountCalculation.breakdown.length > 0 ? (
            <div className="space-y-4">
               {discountCalculation.breakdown.map((breakdown: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {breakdown.parametro.toLowerCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Valor: {Number(breakdown.valor).toFixed(1)}% | Umbral:{" "}
                      {Number(breakdown.umbral).toFixed(1)}% | Descuento:{" "}
                      {Number(breakdown.porcentaje_descuento).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600 font-medium">
                      -{Number(breakdown.peso_descuento).toFixed(2)} kg
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-3 mt-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-700">
                    Total Descontado
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    -{Number(discountCalculation.total_peso_descuento).toFixed(2)} kg
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No se han aplicado descuentos por calidad
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Precios</CardTitle>
          <CardDescription>
            Detalles del cálculo de precios y valoración de la recepción
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pricingCalculation ? (
            <PricingBreakdown pricingCalculation={pricingCalculation} />
          ) : (
            <p className="text-gray-500 text-center py-4">
              No se ha calculado el precio aún
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
