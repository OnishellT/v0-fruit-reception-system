"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { createCashFruitType, updateCashFruitType } from "@/lib/actions/cash/fruit-types";
import { toast } from "sonner";

interface FruitTypeFormProps {
  initialData?: {
    id?: number;
    code: string;
    name: string;
    enabled?: boolean;
  };
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FruitTypeForm({ initialData, isEditing = false, onSuccess, onCancel }: FruitTypeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    // Validate code format
    if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      toast.error("El código debe contener solo letras mayúsculas, números y guiones bajos");
      return;
    }

    try {
      setLoading(true);
      let result;

      if (isEditing && initialData?.id) {
        result = await updateCashFruitType({
          id: initialData.id,
          code: formData.code,
          name: formData.name,
        });
      } else {
        result = await createCashFruitType({
          code: formData.code,
          name: formData.name,
        });
      }

      if (result.success) {
        toast.success(`Tipo de fruta ${isEditing ? 'actualizado' : 'creado'} exitosamente`);
        onSuccess?.();
      } else {
        toast.error(result.error || `Error al ${isEditing ? 'actualizar' : 'crear'} el tipo de fruta`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} fruit type:`, error);
      toast.error(`Error inesperado al ${isEditing ? 'actualizar' : 'crear'} el tipo de fruta`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={onCancel || (() => window.history.back())}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Tipo de Fruta' : 'Nuevo Tipo de Fruta'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditing
            ? 'Modificar la información del tipo de fruta'
            : 'Crear un nuevo tipo de fruta para recepciones en efectivo'
          }
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Tipo de Fruta</CardTitle>
          <CardDescription>
            Configure el código y nombre del tipo de fruta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                type="text"
                placeholder="CAFE"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={32}
                required
              />
              <p className="text-sm text-muted-foreground">
                Código único en mayúsculas (letras, números, guiones bajos)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Café"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                maxLength={64}
                required
              />
              <p className="text-sm text-muted-foreground">
                Nombre descriptivo del tipo de fruta
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => window.history.back())}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Actualizar' : 'Crear'} Tipo de Fruta
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}