"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateQualityEvaluation } from "@/lib/actions/quality-universal";

interface QualityEditingSectionProps {
  reception: any;
  onQualityUpdated?: () => void;
}

export function QualityEditingSection({ reception, onQualityUpdated }: QualityEditingSectionProps) {
  const [qualityData, setQualityData] = useState({
    moho: reception.quality_evaluation?.moho || 0,
    humedad: reception.quality_evaluation?.humedad || 0,
    violetas: reception.quality_evaluation?.violetas || 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateQuality = async () => {
    setIsUpdating(true);
    try {
      const result = await updateQualityEvaluation(reception.id, {
        violetas: qualityData.violetas || 0,
        humedad: qualityData.humedad || 0,
        moho: qualityData.moho || 0,
      });

       if (result.success) {
         alert("Mediciones de calidad actualizadas exitosamente");
         // Call the callback to refresh data or reload the page
         if (onQualityUpdated) {
           onQualityUpdated();
         } else {
           window.location.reload();
         }
       } else {
         alert(`Error: ${result.error}`);
       }
    } catch (error) {
      console.error("Error updating quality:", error);
      alert("Error al actualizar las mediciones de calidad");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="moho">Moho (%)</Label>
          <Input
            id="moho"
            type="number"
            min="0"
            max="100"
            value={qualityData.moho || ""}
            onChange={(e) => {
              const value = Math.min(
                Math.max(0, parseInt(e.target.value) || 0),
                100,
              );
              setQualityData({ ...qualityData, moho: value });
            }}
            className="text-center text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="humedad">Humedad (%)</Label>
          <Input
            id="humedad"
            type="number"
            min="0"
            max="100"
            value={qualityData.humedad || ""}
            onChange={(e) => {
              const value = Math.min(
                Math.max(0, parseInt(e.target.value) || 0),
                100,
              );
              setQualityData({ ...qualityData, humedad: value });
            }}
            className="text-center text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="violetas">Violetas (%)</Label>
          <Input
            id="violetas"
            type="number"
            min="0"
            max="100"
            value={qualityData.violetas || ""}
            onChange={(e) => {
              const value = Math.min(
                Math.max(0, parseInt(e.target.value) || 0),
                100,
              );
              setQualityData({ ...qualityData, violetas: value });
            }}
            className="text-center text-lg"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUpdateQuality}
          disabled={isUpdating}
        >
          {isUpdating ? "Actualizando..." : "Actualizar Calidad"}
        </Button>
      </div>
    </div>
  );
}