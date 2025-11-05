"use client";

interface DiscountBreakdownProps {
  discountBreakdown: any[];
  discountPercentTotal: number;
  discountWeightKg: string;
}

export function DiscountBreakdown({ discountBreakdown, discountPercentTotal, discountWeightKg }: DiscountBreakdownProps) {
  // Ensure discountBreakdown is an array
  const breakdownArray = Array.isArray(discountBreakdown) ? discountBreakdown : [];

  if (!breakdownArray || breakdownArray.length === 0) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Desglose de Descuentos por Calidad</h3>
        <p className="text-xs text-muted-foreground">No se aplicaron descuentos por calidad</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-sm font-semibold mb-3">Desglose de Descuentos por Calidad</h3>
      <div className="space-y-2">
        {breakdownArray.map((item: any, index: number) => (
          <div key={index} className="flex justify-between items-center text-xs">
            <div className="flex-1">
              <span className="font-medium">{item.parametro.replace(' (Evaluación)', '')}</span>
              <span className="text-muted-foreground ml-2">
                ({parseFloat(item.valor).toFixed(1)}% &gt; {parseFloat(item.umbral).toFixed(1)}%)
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-red-600">
                -{parseFloat(item.pesoDescuento).toFixed(3)} kg
              </span>
              <span className="text-muted-foreground ml-1">
                ({parseFloat(item.porcentajeDescuento).toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between items-center font-semibold text-sm">
            <span>Descuento Total por Calidad:</span>
            <span className="font-mono text-red-600">
              -{parseFloat(discountWeightKg || '0').toFixed(3)} kg ({discountPercentTotal.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}