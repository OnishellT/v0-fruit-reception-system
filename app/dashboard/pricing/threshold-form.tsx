"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiscountThreshold, QualityMetric } from "@/lib/types/pricing";

interface ThresholdFormProps {
  initialData?: DiscountThreshold | null;
  onSubmit: (data: Omit<DiscountThreshold, "id" | "pricing_rule_id" | "created_at" | "updated_at" | "created_by" | "updated_by">) => Promise<void>;
  onCancel: () => void;
}

export function ThresholdForm({ initialData, onSubmit, onCancel }: ThresholdFormProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      quality_metric: initialData?.quality_metric || "",
      limit_value: initialData?.limit_value?.toString() || ""
    }
  });

  const qualityMetric = watch("quality_metric");

  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true);
      await onSubmit({
        quality_metric: data.quality_metric as QualityMetric,
        limit_value: parseFloat(data.limit_value)
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quality_metric">Métrica de Calidad</Label>
          <Select
            value={qualityMetric}
            onValueChange={(value) => setValue("quality_metric", value)}
            disabled={!!initialData}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione una métrica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Violetas">Violetas</SelectItem>
              <SelectItem value="Humedad">Humedad</SelectItem>
              <SelectItem value="Moho">Moho</SelectItem>
            </SelectContent>
          </Select>
          {errors.quality_metric && (
            <p className="text-sm text-red-600">Este campo es requerido</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="limit_value">Límite de Calidad (%)</Label>
          <Input
            id="limit_value"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="20.00"
            {...register("limit_value", {
              required: "Límite de calidad es requerido",
              min: { value: 0, message: "Mínimo 0%" },
              max: { value: 100, message: "Máximo 100%" }
            })}
          />
          {errors.limit_value && (
            <p className="text-sm text-red-600">{errors.limit_value.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Cualquier valor por encima de este límite será descontado proporcionalmente
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
