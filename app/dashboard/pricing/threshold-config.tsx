"use client";

import { useState } from "react";
import type { PricingRule, DiscountThreshold, FruitType, QualityMetric } from "@/lib/types/pricing";
import { ThresholdForm } from "./threshold-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ThresholdConfigProps {
  fruitType: FruitType;
  pricingRule: PricingRule;
  thresholds: DiscountThreshold[];
  onThresholdAdded: (threshold: DiscountThreshold) => Promise<void>;
  onThresholdUpdated: (threshold: DiscountThreshold) => Promise<void>;
  onThresholdDeleted: (thresholdId: string) => Promise<void>;
  disabled: boolean;
}

export function ThresholdConfig({
  fruitType,
  pricingRule,
  thresholds,
  onThresholdAdded,
  onThresholdUpdated,
  onThresholdDeleted,
  disabled
}: ThresholdConfigProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<DiscountThreshold | null>(null);

  const handleAdd = () => {
    setEditingThreshold(null);
    setShowForm(true);
  };

  const handleEdit = (threshold: DiscountThreshold) => {
    setEditingThreshold(threshold);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingThreshold(null);
  };

  const handleSubmit = async (data: Omit<DiscountThreshold, "id" | "pricing_rule_id" | "created_at" | "updated_at" | "created_by" | "updated_by">) => {
    const thresholdData = {
      ...data,
      pricing_rule_id: pricingRule.id
    };

    if (editingThreshold) {
      await onThresholdUpdated({
        ...editingThreshold,
        ...data
      });
    } else {
      await onThresholdAdded({
        id: "",
        pricing_rule_id: pricingRule.id,
        created_at: "",
        updated_at: "",
        created_by: "",
        updated_by: "",
        ...data
      } as DiscountThreshold);
    }

    handleCancel();
  };

  // Group thresholds by quality metric
  const thresholdsByMetric = thresholds.reduce((acc, threshold) => {
    if (!acc[threshold.quality_metric]) {
      acc[threshold.quality_metric] = [];
    }
    acc[threshold.quality_metric].push(threshold);
    return acc;
  }, {} as Record<QualityMetric, DiscountThreshold[]>);

  return (
    <div className="space-y-6">
      {!pricingRule.quality_based_pricing_enabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800">Precios basados en calidad deshabilitados</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Debe habilitar los precios basados en calidad para {fruitType} antes de configurar umbrales.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleAdd} disabled={disabled || showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Umbral
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>
              {editingThreshold ? "Editar Umbral de Descuento" : "Nuevo Umbral de Descuento"}
            </CardTitle>
            <CardDescription>
              Configure el rango de valores y el porcentaje de descuento para la métrica de calidad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThresholdForm
              initialData={editingThreshold}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {Object.entries(thresholdsByMetric).map(([metric, metricThresholds]) => (
          <Card key={metric}>
            <CardHeader>
              <CardTitle className="text-lg">{metric}</CardTitle>
              <CardDescription>
                Umbrales de descuento para la métrica {metric}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metricThresholds
                  .sort((a, b) => a.limit_value - b.limit_value)
                  .map((threshold) => (
                     <div
                       key={threshold.id}
                       className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                     >
                       <div className="flex items-center gap-4">
                         <div>
                           <p className="font-medium">
                             Límite: {threshold.limit_value}%
                           </p>
                           <p className="text-sm text-muted-foreground">
                             Valores por encima generan descuento proporcional
                           </p>
                         </div>
                       </div>

                       <div className="flex items-center gap-2">
                         <Badge variant="outline">
                           Límite {threshold.limit_value}%
                         </Badge>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(threshold)}
                          disabled={disabled || showForm}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <ConfirmDialog
                          title="¿Eliminar umbral de descuento?"
                          description="Esta acción no se puede deshacer. El umbral será eliminado permanentemente."
                          confirmText="Eliminar"
                          variant="destructive"
                          onConfirm={() => onThresholdDeleted(threshold.id)}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={disabled || showForm}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </div>
                  ))}

                {metricThresholds.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    No hay umbrales configurados para {metric}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {Object.keys(thresholdsByMetric).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay umbrales configurados para {fruitType}</p>
            <p className="text-sm mt-1">Haga clic en "Agregar Umbral" para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}
