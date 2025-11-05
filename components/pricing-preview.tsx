"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calculator, AlertCircle } from "lucide-react";
import { PricingBreakdown } from "./pricing-breakdown";
import { formatCurrency } from "@/lib/utils/pricing";
import type { PricingCalculationPreview, FruitType, QualityMetric } from "@/lib/types/pricing";

interface PricingPreviewProps {
  fruitType: FruitType;
  totalWeight: number;
  basePricePerKg: number;
  qualityMetrics: Array<{ metric: QualityMetric; value: number }>;
  receptionId?: string; // Optional reception ID to include lab samples
  onCalculate?: (preview: PricingCalculationPreview | null) => void;
}

export function PricingPreview({
  fruitType,
  totalWeight,
  basePricePerKg,
  qualityMetrics,
  receptionId,
  onCalculate
}: PricingPreviewProps) {
  const [preview, setPreview] = useState<PricingCalculationPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate pricing when dependencies change
  useEffect(() => {
    const calculatePricing = async () => {
      // Only calculate if we have all required data
      if (!fruitType || !totalWeight || !basePricePerKg || qualityMetrics.length === 0) {
        setPreview(null);
        setError(null);
        onCalculate?.(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/pricing/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fruit_type: fruitType,
            total_weight: totalWeight,
            base_price_per_kg: basePricePerKg,
            quality_evaluation: qualityMetrics,
            reception_id: receptionId
          })
        });

        const data = await response.json();

        if (data.can_calculate && data.data) {
          setPreview(data.data);
          onCalculate?.(data.data);
        } else {
          setPreview(null);
          setError(data.errors?.join(", ") || "No se puede calcular el precio");
          onCalculate?.(null);
        }
      } catch (err) {
        console.error("Error calculating pricing:", err);
        setError("Error al calcular el precio");
        setPreview(null);
        onCalculate?.(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the calculation
    const timeoutId = setTimeout(calculatePricing, 500);
    return () => clearTimeout(timeoutId);
  }, [fruitType, totalWeight, basePricePerKg, qualityMetrics, receptionId, onCalculate]);

  // Show nothing if we don't have enough data
  if (!fruitType || !totalWeight || !basePricePerKg) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            Vista Previa de Precio
          </CardTitle>
          <CardDescription>
            Cálculo automático basado en calidad para {fruitType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Calculando precio...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">No se puede calcular el precio</p>
                <p className="text-sm text-yellow-700 mt-1">{error}</p>
                {qualityMetrics.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Agregue la evaluación de calidad para calcular el precio.
                  </p>
                )}
              </div>
            </div>
          )}

          {preview && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Valor Bruto</p>
                  <p className="text-lg font-semibold">{formatCurrency(preview.gross_value)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Descuentos</p>
                  <p className="text-lg font-semibold text-red-600">
                    {preview.total_discount_amount > 0
                      ? `-${formatCurrency(preview.total_discount_amount)}`
                      : "$0.00"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Final</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(preview.final_total)}</p>
                </div>
              </div>

              {preview.discount_breakdown.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Descuentos por Métrica:</p>
                  <div className="space-y-2">
                    {preview.discount_breakdown.map((discount, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-red-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {discount.quality_metric}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {discount.value}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            {discount.discount_percentage}%
                          </Badge>
                          <span className="text-sm font-medium text-red-600">
                            -{formatCurrency(discount.discount_amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!preview && !loading && !error && qualityMetrics.length > 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>No hay descuentos aplicables para los valores de calidad ingresados.</p>
              <p className="text-sm mt-1">El precio final será el valor bruto sin descuentos.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
