"use client";

import { useState, useEffect } from "react";
import type {
  PricingRule,
  DiscountThreshold,
  FruitType,
  QualityMetric
} from "@/lib/types/pricing";
import { PricingRulesTable } from "./pricing-rules-table";
import { ThresholdConfig } from "./threshold-config";
import { PricingChangeLog } from "@/components/pricing-change-log";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const FRUIT_TYPES: FruitType[] = ["CAFÉ", "CACAO", "MIEL", "COCOS"];
const QUALITY_METRICS: QualityMetric[] = ["Violetas", "Humedad", "Moho"];

export function PricingRulesClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedFruitType, setSelectedFruitType] = useState<FruitType>("CAFÉ");
  const [pricingRules, setPricingRules] = useState<Record<FruitType, PricingRule>>({} as Record<FruitType, PricingRule>);
  const [thresholds, setThresholds] = useState<Record<string, DiscountThreshold[]>>({});
  const [changes, setChanges] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    loadPricingRules();
  }, []);

  // Load thresholds when fruit type changes
  useEffect(() => {
    if (pricingRules[selectedFruitType]?.id) {
      loadThresholds(selectedFruitType);
    }
  }, [selectedFruitType, pricingRules]);

  const loadPricingRules = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pricing/rules", {
        credentials: "include"
      });
      const data = await response.json();

      if (data.success && data.data) {
        const rulesMap = data.data.reduce((acc: Record<string, PricingRule>, rule: PricingRule) => {
          acc[rule.fruit_type] = rule;
          return acc;
        }, {});
        setPricingRules(rulesMap);
      }
    } catch (error) {
      console.error("Error loading pricing rules:", error);
      setMessage({ type: "error", text: "Error al cargar las reglas de precios" });
    } finally {
      setLoading(false);
    }
  };

  const loadThresholds = async (fruitType: FruitType) => {
    try {
      const response = await fetch(`/api/pricing/thresholds?fruitType=${fruitType}`, {
        credentials: "include"
      });
      const data = await response.json();

      if (data.success && data.data) {
        // If data is empty, just set empty array (migration not applied yet)
        setThresholds(prev => ({
          ...prev,
          [fruitType]: data.data
        }));
      }
    } catch (error) {
      console.error("Error loading thresholds:", error);
    }
  };

  const loadChangeHistory = async () => {
    try {
      // Use the correct endpoint
      const response = await fetch(`/api/pricing/history`, {
        credentials: "include"
      });
      const data = await response.json();

      if (data.success && data.data) {
        setChanges(data.data);
      }
    } catch (error) {
      console.error("Error loading change history:", error);
      // Set empty array on error (migration not applied yet)
      setChanges([]);
    }
  };

  // Load change history on mount
  useEffect(() => {
    loadChangeHistory();
  }, []);

  const handleTogglePricing = (fruitType: FruitType, enabled: boolean) => {
    return (async () => {
      try {
        setSaving(true);
        const response = await fetch("/api/pricing/rules", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            fruit_type: fruitType,
            quality_based_pricing_enabled: enabled
          })
        });

        const data = await response.json();

        if (data.success) {
          setPricingRules(prev => ({
            ...prev,
            [fruitType]: data.data
          }));
          setMessage({ type: "success", text: `Precios basados en calidad ${enabled ? "habilitados" : "deshabilitados"} para ${fruitType}` });
        } else {
          setMessage({ type: "error", text: data.error || "Error al actualizar la configuración" });
        }
      } catch (error) {
        console.error("Error updating pricing rule:", error);
        setMessage({ type: "error", text: "Error al actualizar la configuración" });
      } finally {
        setSaving(false);
        setTimeout(() => setMessage(null), 3000);
      }
    })();
  };

  const handleThresholdAdded = (fruitType: FruitType, threshold: DiscountThreshold) => {
    return (async () => {
      try {
        console.log('🔄 Adding threshold in client:', { fruitType, threshold });

        const pricingRule = pricingRules[fruitType];
        if (!pricingRule) {
          throw new Error("Regla de precios no encontrada");
        }

        const response = await fetch("/api/pricing/thresholds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            pricing_rule_id: pricingRule.id,
            quality_metric: threshold.quality_metric,
            limit_value: threshold.limit_value
          })
        });

        const data = await response.json();
        console.log('📊 API Response:', data);

        if (!data.success) {
          throw new Error(data.error || "Error al crear el umbral");
        }

        // Verify that data.data exists
        if (!data.data) {
          console.error('❌ No data returned from API:', data);
          throw new Error("No se recibieron datos del servidor");
        }

        console.log('✅ Adding to local state:', data.data);

        // Update local state with the returned data (which includes ID and timestamps)
        setThresholds(prev => {
          const updated = {
            ...prev,
            [fruitType]: [...(prev[fruitType] || []), data.data]
          };
          console.log('📝 New state:', updated);
          return updated;
        });

        setMessage({ type: "success", text: "Umbral de descuento creado exitosamente" });
      } catch (error: any) {
        console.error("Error adding threshold:", error);
        setMessage({ type: "error", text: error.message || "Error al crear el umbral" });
      } finally {
        setTimeout(() => setMessage(null), 3000);
      }
    })();
  };

  const handleThresholdUpdated = (fruitType: FruitType, threshold: DiscountThreshold) => {
    return (async () => {
      try {
        console.log('🔄 Updating threshold in client:', { fruitType, threshold });

        const response = await fetch("/api/pricing/thresholds", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: threshold.id,
            limit_value: threshold.limit_value
          })
        });

        const data = await response.json();
        console.log('📊 API Response:', data);

        if (!data.success) {
          throw new Error(data.error || "Error al actualizar el umbral");
        }

        // Verify that data.data exists
        if (!data.data) {
          console.error('❌ No data returned from API:', data);
          throw new Error("No se recibieron datos del servidor");
        }

        console.log('✅ Updating local state with:', data.data);

        // Update local state with the returned data
        setThresholds(prev => {
          const updated = {
            ...prev,
            [fruitType]: prev[fruitType]?.map(t => t.id === threshold.id ? data.data : t) || []
          };
          console.log('📝 New state:', updated);
          return updated;
        });

        setMessage({ type: "success", text: "Umbral de descuento actualizado exitosamente" });
      } catch (error: any) {
        console.error("Error updating threshold:", error);
        setMessage({ type: "error", text: error.message || "Error al actualizar el umbral" });
      } finally {
        setTimeout(() => setMessage(null), 3000);
      }
    })();
  };

  const handleThresholdDeleted = (fruitType: FruitType, thresholdId: string) => {
    return (async () => {
      try {
        const response = await fetch(`/api/pricing/thresholds?id=${thresholdId}`, {
          method: "DELETE",
          credentials: "include"
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Error al eliminar el umbral");
        }

        // Update local state
        setThresholds(prev => ({
          ...prev,
          [fruitType]: prev[fruitType]?.filter(t => t.id !== thresholdId) || []
        }));

        setMessage({ type: "success", text: "Umbral de descuento eliminado exitosamente" });
      } catch (error: any) {
        console.error("Error deleting threshold:", error);
        setMessage({ type: "error", text: error.message || "Error al eliminar el umbral" });
      } finally {
        setTimeout(() => setMessage(null), 3000);
      }
    })();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-500" : "border-red-500"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-700" : "text-red-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">Reglas de Precios</TabsTrigger>
          <TabsTrigger value="configuration">Configuración de Umbrales</TabsTrigger>
          <TabsTrigger value="history">Historial de Cambios</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de Precios por Tipo de Fruto</CardTitle>
              <CardDescription>
                Habilite o deshabilite los precios basados en calidad para cada tipo de fruto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingRulesTable
                pricingRules={pricingRules}
                onTogglePricing={handleTogglePricing}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Umbrales de Descuento</CardTitle>
              <CardDescription>
                Configure los rangos de calidad y porcentajes de descuento para cada métrica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedFruitType} onValueChange={(value: string) => setSelectedFruitType(value as FruitType)}>
                <TabsList className="grid w-full grid-cols-4">
                  {FRUIT_TYPES.map(type => (
                    <TabsTrigger key={type} value={type}>{type}</TabsTrigger>
                  ))}
                </TabsList>

                {FRUIT_TYPES.map(fruitType => (
                  <TabsContent key={fruitType} value={fruitType} className="mt-6">
                    <ThresholdConfig
                      fruitType={fruitType}
                      pricingRule={pricingRules[fruitType]}
                      thresholds={thresholds[fruitType] || []}
                      onThresholdAdded={(threshold) => handleThresholdAdded(fruitType, threshold)}
                      onThresholdUpdated={(threshold) => handleThresholdUpdated(fruitType, threshold)}
                      onThresholdDeleted={(thresholdId) => handleThresholdDeleted(fruitType, thresholdId)}
                      disabled={!pricingRules[fruitType]?.quality_based_pricing_enabled}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <PricingChangeLog changes={changes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
