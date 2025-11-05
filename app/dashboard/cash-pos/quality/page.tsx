"use client";

"use client";

import { useState, useEffect } from "react";
import { ThresholdForm } from "@/components/cash-pos/threshold-form";
import { ThresholdList } from "@/components/cash-pos/threshold-list";
import { getCashFruitTypes } from "@/lib/actions/cash/fruit-types";

interface FruitType {
  id: number;
  name: string;
  code: string;
}

export default function QualityPage() {
  const [fruitTypes, setFruitTypes] = useState<FruitType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFruitTypes();
  }, []);

  const loadFruitTypes = async () => {
    try {
      const result = await getCashFruitTypes();
      if (result.success && result.data) {
        // Use the data directly since it's already in the right format
        setFruitTypes(result.data);
      } else {
        console.error("Error loading fruit types:", result.error);
      }
    } catch (error) {
      console.error("Error loading fruit types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdCreated = () => {
    // This will trigger a re-render of ThresholdList via its useEffect
    window.location.reload(); // Simple refresh for now
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando configuración de calidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Umbrales de Calidad</h1>
        <p className="text-muted-foreground mt-2">
          Configure estándares de calidad para el cálculo automático de descuentos
        </p>
      </div>

      <div className="space-y-8">
        <ThresholdForm
          fruitTypes={fruitTypes}
          onSuccess={handleThresholdCreated}
        />

        <ThresholdList fruitTypes={fruitTypes} />
      </div>
    </div>
  );
}