"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Detail {
  fruit_type_id: string;
  quantity: number;
  weight_kg: number;
}

interface MobileDetailsListProps {
  details: Detail[];
  getFruitTypeLabel: (id: string) => string;
  onRemoveDetail: (index: number) => void;
  disabled?: boolean;
}

export function MobileDetailsList({
  details,
  getFruitTypeLabel,
  onRemoveDetail,
  disabled = false,
}: MobileDetailsListProps) {
  const totalQuantity = details.reduce((sum, d) => sum + d.quantity, 0);
  const totalWeight = details.reduce((sum, d) => sum + d.weight_kg, 0);

  if (details.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Detalles de Pesada</h3>

      {/* Mobile Card List */}
      <div className="space-y-3">
        {details.map((detail, index) => (
          <Card key={index} className="border-2">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-2">
                    Registro #{index + 1}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Tipo:</span>
                      <span className="ml-2 text-sm">
                        {getFruitTypeLabel(detail.fruit_type_id)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Cantidad:</span>
                        <span className="ml-2 text-lg font-bold">
                          {detail.quantity}
                        </span>
                      </div>

                      <div>
                        <span className="text-sm font-medium">Peso:</span>
                        <span className="ml-2 text-lg font-bold">
                          {detail.weight_kg.toFixed(2)} kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveDetail(index)}
                  disabled={disabled}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Summary Cards */}
      <div className="space-y-3">
        <div className="grid gap-3">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
              Total Cantidad
            </div>
            <div className="text-3xl font-bold text-blue-700 mt-1">
              {totalQuantity}
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
              Total Peso
            </div>
            <div className="text-3xl font-bold text-green-700 mt-1">
              {totalWeight.toFixed(2)} kg
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
