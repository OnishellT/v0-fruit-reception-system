"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BatchProcessingSectionProps {
  reception: any;
}

export function BatchProcessingSection({ reception }: BatchProcessingSectionProps) {
  const [proportionalDriedWeight, setProportionalDriedWeight] = useState<string>(
    reception.proportional_dried_weight?.toString() || ""
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProportionalWeight = async () => {
    if (!proportionalDriedWeight || isNaN(parseFloat(proportionalDriedWeight))) {
      alert("Por favor ingrese un peso válido");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/batches/${reception.f_batch_id}/receptions/${reception.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            proportional_dried_weight: parseFloat(proportionalDriedWeight),
          }),
        }
      );

      if (response.ok) {
        alert("Peso proporcional actualizado exitosamente");
        // Optionally refresh the page to show updated data
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating proportional weight:", error);
      alert("Error al actualizar el peso proporcional");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="batch_id">ID del Lote</Label>
          <Input
            id="batch_id"
            value={reception.f_batch_id}
            disabled
            className="bg-gray-50"
          />
        </div>
        <div>
          <Label htmlFor="proportional_dried_weight">Peso Seco Proporcional (kg)</Label>
          <Input
            id="proportional_dried_weight"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={proportionalDriedWeight}
            onChange={(e) => setProportionalDriedWeight(e.target.value)}
            className="text-right"
          />
          <p className="text-xs text-gray-500 mt-1">
            Peso seco calculado proporcionalmente del lote
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUpdateProportionalWeight}
          disabled={isUpdating}
        >
          {isUpdating ? "Actualizando..." : "Actualizar Peso Proporcional"}
        </Button>
      </div>
    </div>
  );
}