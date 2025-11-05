"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateLaboratorySampleSchema } from "@/lib/schemas/cacao";
import { UpdateLaboratorySample, LaboratorySample } from "@/lib/types/cacao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UpdateLabSampleFormProps {
  sample: LaboratorySample;
  onSuccess?: () => void;
}

export function UpdateLabSampleForm({
  sample,
  onSuccess,
}: UpdateLabSampleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateLaboratorySample>({
    resolver: zodResolver(UpdateLaboratorySampleSchema),
    defaultValues: {
      dried_sample_kg: sample.dried_sample_kg || undefined,
      violetas_percentage: sample.violetas_percentage || undefined,
      moho_percentage: sample.moho_percentage || undefined,
      basura_percentage: sample.basura_percentage || undefined,
    },
  });

  const onSubmit = async (data: UpdateLaboratorySample) => {
    try {
      const response = await fetch(`/api/samples/${sample.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update laboratory sample",
        );
      }

      toast.success("Muestra de laboratorio actualizada exitosamente");
      onSuccess?.();

      // Force page refresh to show updated reception data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Check if sample is already completed
  const isCompleted = sample.status === "Result Entered";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {isCompleted && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm font-medium">
            ⚠️ Esta muestra ya ha sido completada y no puede ser modificada.
          </p>
        </div>
      )}

      {!isCompleted && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            ℹ️ <strong>Importante:</strong> Una vez que envíe el peso seco,
            esta muestra no podrá actualizarse nuevamente. Por favor verifique todos los valores
            antes de enviar.
          </p>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="dried_sample_kg">Peso Seco de Muestra (kg)</Label>
        <Input
          id="dried_sample_kg"
          type="number"
          step="0.01"
          {...register("dried_sample_kg", { valueAsNumber: true })}
          disabled={isCompleted || isSubmitting}
        />
        {errors.dried_sample_kg && (
          <p className="text-red-500 text-sm">
            {errors.dried_sample_kg.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="violetas_percentage">Violetas (%)</Label>
        <Input
          id="violetas_percentage"
          type="number"
          step="0.01"
          {...register("violetas_percentage", { valueAsNumber: true })}
          disabled={isCompleted || isSubmitting}
        />
        {errors.violetas_percentage && (
          <p className="text-red-500 text-sm">
            {errors.violetas_percentage.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="moho_percentage">Moho (%)</Label>
        <Input
          id="moho_percentage"
          type="number"
          step="0.01"
          {...register("moho_percentage", { valueAsNumber: true })}
          disabled={isCompleted || isSubmitting}
        />
        {errors.moho_percentage && (
          <p className="text-red-500 text-sm">
            {errors.moho_percentage.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="basura_percentage">Basura (%)</Label>
        <Input
          id="basura_percentage"
          type="number"
          step="0.01"
          {...register("basura_percentage", { valueAsNumber: true })}
          disabled={isCompleted || isSubmitting}
        />
        {errors.basura_percentage && (
          <p className="text-red-500 text-sm">
            {errors.basura_percentage.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isCompleted || isSubmitting}>
        {isSubmitting
          ? "Actualizando..."
          : isCompleted
            ? "Completada"
            : "Completar Muestra"}
      </Button>
    </form>
  );
}
