"use client";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DollarSign, XCircle } from "lucide-react";
import type { PricingRule, FruitType } from "@/lib/types/pricing";

interface PricingRulesTableProps {
  pricingRules: Record<FruitType, PricingRule>;
  onTogglePricing: (fruitType: FruitType, enabled: boolean) => Promise<void>;
  saving: boolean;
}

export function PricingRulesTable({ pricingRules, onTogglePricing, saving }: PricingRulesTableProps) {
  const handleToggle = (fruitType: FruitType, currentEnabled: boolean) => {
    onTogglePricing(fruitType, !currentEnabled);
  };

  return (
    <div className="space-y-4">
      {Object.values(pricingRules).map((rule) => (
        <div
          key={rule.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{rule.fruit_type}</h3>
              <p className="text-sm text-muted-foreground">
                Precios basados en calidad para recepciones de {rule.fruit_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge
              variant={rule.quality_based_pricing_enabled ? "default" : "secondary"}
              className={rule.quality_based_pricing_enabled ? "bg-green-500" : ""}
            >
              {rule.quality_based_pricing_enabled ? "Habilitado" : "Deshabilitado"}
            </Badge>

            <Switch
              checked={rule.quality_based_pricing_enabled}
              onCheckedChange={(checked: boolean) => handleToggle(rule.fruit_type, rule.quality_based_pricing_enabled)}
              disabled={saving}
            />
          </div>
        </div>
      ))}

      {Object.keys(pricingRules).length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay reglas de precios configuradas</h3>
          <p className="text-muted-foreground">
            Las reglas de precios se configurarán automáticamente al guardar.
          </p>
        </div>
      )}
    </div>
  );
}
