"use client";

import { useState, useEffect } from "react";
import { DailyPriceForm } from "@/components/daily-price-form";
import { DailyPriceList } from "@/components/daily-price-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, History } from "lucide-react";

interface FruitType {
  id: string;
  type: string;
  subtype: string;
}

export function DailyPricingClient() {
  const [fruitTypes, setFruitTypes] = useState<FruitType[]>([]);
  const [loading, setLoading] = useState(true);

  // Load fruit types on component mount
  useEffect(() => {
    loadFruitTypes();
  }, []);

  const loadFruitTypes = async () => {
    try {
      setLoading(true);
      console.log("Loading fruit types...");
      const response = await fetch("/api/fruit-types", {
        credentials: "include"
      });
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (data.success && data.data) {
        console.log("Setting fruit types:", data.data);
        setFruitTypes(data.data);
      } else {
        console.error("API returned error:", data);
      }
    } catch (error) {
      console.error("Error loading fruit types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceCreated = () => {
    // This will trigger a re-render of the price list
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="set-price" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="set-price" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Establecer Precio Diario
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historial de Precios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="set-price" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Precios Diarios</CardTitle>
              <CardDescription>
                Establezca precios diarios para cada tipo de fruta. Estos precios se utilizarán automáticamente
                en los cálculos de recepción y se aplicarán descuentos basados en calidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyPriceForm
                fruitTypes={fruitTypes}
                onSuccess={handlePriceCreated}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DailyPriceList fruitTypes={fruitTypes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}