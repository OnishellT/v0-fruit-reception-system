"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, TrendingDown, FlaskConical, Package, DollarSign } from "lucide-react";
import { DailyReceptionsProvider } from "@/hooks/use-daily-receptions";
import { ReceptionForm } from "@/components/reception-form";
import { QualityEditingSection } from "@/components/quality-editing-section";
import { LaboratorySamplesSection } from "@/components/laboratory-samples-section";
import { BatchProcessingSection } from "@/components/batch-processing-section";
import { PricingBreakdown } from "@/components/pricing-breakdown";

interface ReceptionEditClientProps {
  receptionId: string;
  reception: any;
  details: any[];
  pricingCalculation: any;
  discountCalculation: any;
  providers: any[];
  drivers: any[];
  fruitTypes: any[];
}

export function ReceptionEditClient({
  receptionId,
  reception,
  details,
  pricingCalculation,
  discountCalculation,
  providers,
  drivers,
  fruitTypes,
}: ReceptionEditClientProps) {
  const isCacaoVerde = details?.some(
    (d) => d.fruit_type?.type === "CACAO" && d.fruit_type?.subtype === "Verde",
  );

  const hasBatch = !!reception.f_batch_id;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className={`grid w-full ${isCacaoVerde && hasBatch ? 'grid-cols-4' : isCacaoVerde || hasBatch ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="basic" className="flex items-center justify-center gap-2">
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Datos Básicos</span>
            <span className="sm:hidden">Básicos</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center justify-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Calidad</span>
            <span className="sm:hidden">Calidad</span>
          </TabsTrigger>
          {isCacaoVerde && (
            <TabsTrigger value="laboratory" className="flex items-center justify-center gap-2">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Laboratorio</span>
              <span className="sm:hidden">Lab</span>
            </TabsTrigger>
          )}
          {hasBatch && (
            <TabsTrigger value="batch" className="flex items-center justify-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Procesamiento</span>
              <span className="sm:hidden">Lote</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Basic Reception Data Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Datos Básicos de Recepción
              </CardTitle>
              <CardDescription>
                Modifique los campos principales de la recepción
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyReceptionsProvider>
                <ReceptionForm
                  providers={providers}
                  drivers={drivers}
                  fruitTypes={fruitTypes}
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
              </DailyReceptionsProvider>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Measurements Tab */}
        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-600" />
                Medición de Calidad
              </CardTitle>
              <CardDescription>
                Editar los porcentajes de calidad (moho, humedad, violetas) para descuentos automáticos
              </CardDescription>
            </CardHeader>
             <CardContent>
               <QualityEditingSection
                 reception={reception}
                 onQualityUpdated={() => window.location.reload()}
               />
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
        </TabsContent>

        {/* Laboratory Samples Tab */}
        {isCacaoVerde && (
          <TabsContent value="laboratory">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-blue-600" />
                  Gestión de Muestras de Laboratorio
                </CardTitle>
                <CardDescription>
                  Crear, editar y gestionar resultados de análisis de laboratorio para cacao verde
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LaboratorySamplesSection receptionId={receptionId} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Batch Processing Tab */}
        {hasBatch && (
          <TabsContent value="batch">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  Resultados de Procesamiento de Lote
                </CardTitle>
                <CardDescription>
                  Editar resultados proporcionales de secado del lote asignado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BatchProcessingSection reception={reception} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}