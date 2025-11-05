"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingDown, FileText } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils/pricing";
import type { PricingCalculation } from "@/lib/types/pricing";

interface PricingBreakdownProps {
  pricingCalculation: PricingCalculation;
  showHeader?: boolean;
  compact?: boolean;
}

export function PricingBreakdown({
  pricingCalculation,
  showHeader = true,
  compact = false
}: PricingBreakdownProps) {
  const {
    base_price_per_kg,
    total_weight,
    gross_value,
    total_discount_amount,
    final_total,
    calculation_data
  } = pricingCalculation;

  // Quality metrics only affect weight, not price. No price discounts.
  const hasDiscounts = false;

  if (compact) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor Bruto:</span>
              <span className="font-medium">{formatCurrency(gross_value)}</span>
            </div>



            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Final:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(final_total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Desglose de Precios
          </CardTitle>
          <CardDescription>
            Cálculo de precios basado en peso final después de descuentos por calidad
          </CardDescription>
        </CardHeader>
      )}

      <CardContent>
        <div className="space-y-6">
          {/* Base Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Precio Base por KG</p>
              <p className="text-lg font-semibold">{formatCurrency(base_price_per_kg)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Peso Final (después de descuentos)</p>
              <p className="text-lg font-semibold">{total_weight.toFixed(2)} KG</p>
            </div>
          </div>

          <Separator />

          {/* Gross Value */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium">Valor Bruto</span>
              <span className="text-lg font-semibold">{formatCurrency(gross_value)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(base_price_per_kg)} × {total_weight.toFixed(2)} KG
            </p>
          </div>

           {/* Quality Metrics Note */}
           {calculation_data.quality_metrics && calculation_data.quality_metrics.length > 0 && (
             <>
               <Separator />
               <div className="space-y-3">
                 <div className="flex items-center gap-2">
                   <FileText className="h-5 w-5 text-blue-600" />
                   <span className="text-base font-medium">Métricas de Calidad Evaluadas</span>
                 </div>

                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                   <p className="text-sm text-blue-800">
                     Las métricas de calidad afectan únicamente el peso final, no el precio.
                     El cálculo de precios se basa en el peso final después de aplicar descuentos por calidad.
                   </p>
                   <div className="mt-2 space-y-1">
                     {calculation_data.quality_metrics.map((metric, index) => (
                       <div key={index} className="text-xs text-blue-700">
                         {metric.metric}: {metric.value}%
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </>
           )}

          {/* Final Total */}
          <Separator />
          <div className="space-y-2 bg-primary/5 border border-primary/20 rounded-lg p-4">
             <div className="flex items-center justify-between">
               <span className="text-lg font-bold">Total Final a Pagar</span>
               <span className="text-2xl font-bold text-primary">
                 {formatCurrency(final_total)}
               </span>
             </div>
             <p className="text-sm text-center text-muted-foreground">
               Cálculo basado en peso final después de descuentos por calidad de fruto
             </p>
          </div>

          {/* Calculation Details */}
          <div className="pt-4 border-t">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <FileText className="h-4 w-4 mt-0.5" />
              <div className="space-y-1">
                <p>Cálculo realizado el: {new Date(calculation_data.timestamp).toLocaleString()}</p>
                <p>Tipo de fruto: {calculation_data.fruit_type}</p>
                <p>Umbrales aplicados: {calculation_data.applied_thresholds.length}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
