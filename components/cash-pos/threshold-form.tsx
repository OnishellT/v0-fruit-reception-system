"use client";

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { createQualityThreshold } from "@/lib/actions/cash/quality";
import { toast } from "sonner";

interface ThresholdFormProps {
  fruitTypes: Array<{ id: number; name: string; code: string }>;
  onSuccess?: () => void;
}

export function ThresholdForm({ fruitTypes, onSuccess }: ThresholdFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fruit_type_id: "",
    metric: "",
    threshold_percent: "",
  });

  const qualityMetrics = [
    { value: "Humedad", label: "Humedad (%)" },
    { value: "Moho", label: "Moho (%)" },
    { value: "Violetas", label: "Violetas (%)" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fruit_type_id || !formData.metric || !formData.threshold_percent) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    const thresholdValue = parseFloat(formData.threshold_percent);
    if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
      toast.error("El porcentaje del umbral debe estar entre 0 y 100");
      return;
    }

    try {
      setLoading(true);
      const result = await createQualityThreshold({
        fruit_type_id: parseInt(formData.fruit_type_id),
        metric: formData.metric,
        threshold_percent: thresholdValue,
      });

      if (result.success) {
        toast.success("Umbral de calidad creado exitosamente");
        setFormData({
          fruit_type_id: "",
          metric: "",
          threshold_percent: "",
        });
        onSuccess?.();
      } else {
        toast.error(result.error || "Error al crear el umbral");
      }
    } catch (error) {
      console.error("Error creando umbral:", error);
      toast.error("Error inesperado al crear el umbral");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Umbral de Calidad
        </CardTitle>
        <CardDescription>
          Configure los estándares de calidad para el cálculo automático de descuentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fruit_type">Tipo de Fruta</Label>
              <Select
                value={formData.fruit_type_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fruit_type_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de fruta" />
                </SelectTrigger>
                <SelectContent>
                  {fruitTypes.map((type, index) => (
                    <SelectItem key={`fruit-type-${type.id}-${index}`} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric">Parámetro de Calidad</Label>
              <Select
                value={formData.metric}
                onValueChange={(value) => setFormData(prev => ({ ...prev, metric: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar parámetro" />
                </SelectTrigger>
                <SelectContent>
                  {qualityMetrics.map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Umbral (%)</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
                value={formData.threshold_percent}
                onChange={(e) => setFormData(prev => ({ ...prev, threshold_percent: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Umbral
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}