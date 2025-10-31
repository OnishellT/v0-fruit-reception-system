"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QualityEvaluationModalProps, QualityFormData } from "@/types/quality-cafe";
import { createQualityEvaluation, updateQualityEvaluation } from "@/lib/actions/quality-cafe";
import { createQualitySchema, updateQualitySchema } from "@/lib/utils/quality-validations";

export function QualityEvaluationModal({
  recepcionId,
  reception,
  userRole,
  existingQuality,
  onSaved,
  onClose,
  isOpen,
}: QualityEvaluationModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    violetas?: string;
    humedad?: string;
    moho?: string;
    general?: string;
  }>({});

  // Form state
  const [formData, setFormData] = useState<QualityFormData>({
    violetas: existingQuality?.violetas?.toString() || "",
    humedad: existingQuality?.humedad?.toString() || "",
    moho: existingQuality?.moho?.toString() || "",
  });

  const isReadOnly = userRole !== "admin" || (existingQuality && userRole !== "admin");

  const handleInputChange = (field: keyof QualityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    // Validate violetas
    const violetas = parseFloat(formData.violetas);
    if (isNaN(violetas)) {
      newErrors.violetas = "Violetas es requerido";
    } else if (violetas < 0 || violetas > 100) {
      newErrors.violetas = "Violetas debe estar entre 0 y 100";
    }

    // Validate humedad
    const humedad = parseFloat(formData.humedad);
    if (isNaN(humedad)) {
      newErrors.humedad = "Humedad es requerido";
    } else if (humedad < 0 || humedad > 100) {
      newErrors.humedad = "Humedad debe estar entre 0 y 100";
    }

    // Validate moho
    const moho = parseFloat(formData.moho);
    if (isNaN(moho)) {
      newErrors.moho = "Moho es requerido";
    } else if (moho < 0 || moho > 100) {
      newErrors.moho = "Moho debe estar entre 0 y 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isReadOnly) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const violetas = parseFloat(formData.violetas);
      const humedad = parseFloat(formData.humedad);
      const moho = parseFloat(formData.moho);

      let result;
      if (existingQuality) {
        // Update existing quality evaluation
        result = await updateQualityEvaluation(recepcionId, {
          violetas,
          humedad,
          moho,
        });
      } else {
        // Create new quality evaluation
        result = await createQualityEvaluation({
          recepcion_id: recepcionId,
          violetas,
          humedad,
          moho,
        });
      }

      if (!result.success) {
        setErrors({ general: result.error || "Error al guardar la evaluación" });
        return;
      }

      // Success - close modal and refresh
      if (onSaved) onSaved();
      if (onClose) onClose();
      router.refresh();
    } catch (error: any) {
      setErrors({ general: "Error inesperado. Por favor intente nuevamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Evaluación de Calidad — Café Seco</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reception info */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Recepción: {reception.reception_number}</p>
            <p className="text-sm text-gray-600">Tipo: {reception.fruit_type} - {reception.fruit_subtype}</p>
          </div>

          {/* Error message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            {/* Violetas field */}
            <div className="space-y-2">
              <Label htmlFor="violetas">
                Violetas (%) {isReadOnly ? "" : "*"}
              </Label>
              <Input
                id="violetas"
                name="violetas"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.violetas}
                onChange={(e) => handleInputChange("violetas", e.target.value)}
                disabled={isSubmitting || isReadOnly}
                className={errors.violetas ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.violetas && (
                <p className="text-sm text-red-600">{errors.violetas}</p>
              )}
            </div>

            {/* Humedad field */}
            <div className="space-y-2">
              <Label htmlFor="humedad">
                Humedad (%) {isReadOnly ? "" : "*"}
              </Label>
              <Input
                id="humedad"
                name="humedad"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.humedad}
                onChange={(e) => handleInputChange("humedad", e.target.value)}
                disabled={isSubmitting || isReadOnly}
                className={errors.humedad ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.humedad && (
                <p className="text-sm text-red-600">{errors.humedad}</p>
              )}
            </div>

            {/* Moho field */}
            <div className="space-y-2">
              <Label htmlFor="moho">
                Moho (%) {isReadOnly ? "" : "*"}
              </Label>
              <Input
                id="moho"
                name="moho"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.moho}
                onChange={(e) => handleInputChange("moho", e.target.value)}
                disabled={isSubmitting || isReadOnly}
                className={errors.moho ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.moho && (
                <p className="text-sm text-red-600">{errors.moho}</p>
              )}
            </div>
          </div>

          {/* Read-only notice */}
          {isReadOnly && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
              {userRole !== "admin" 
                ? "Solo los administradores pueden modificar los datos de calidad." 
                : "Modo solo lectura"}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {isReadOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!isReadOnly && (
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
