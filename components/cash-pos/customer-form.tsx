"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { createCashCustomer, updateCashCustomer } from "@/lib/actions/cash/customers";
import { toast } from "sonner";

interface CustomerFormProps {
  initialData?: {
    id?: number;
    name: string;
    nationalId: string;
  };
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CustomerForm({ initialData, isEditing = false, onSuccess, onCancel }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    nationalId: initialData?.nationalId || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.nationalId.trim()) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    // Validate national ID format
    if (!/^[0-9\-]+$/.test(formData.nationalId)) {
      toast.error("La cédula debe contener solo números y guiones");
      return;
    }

    try {
      setLoading(true);
      let result;

      if (isEditing && initialData?.id) {
        result = await updateCashCustomer({
          id: initialData.id,
          name: formData.name,
          nationalId: formData.nationalId,
        });
      } else {
        result = await createCashCustomer({
          name: formData.name,
          nationalId: formData.nationalId,
        });
      }

      if (result.success) {
        toast.success(`Cliente ${isEditing ? 'actualizado' : 'creado'} exitosamente`);
        onSuccess?.();
      } else {
        toast.error(result.error || `Error al ${isEditing ? 'actualizar' : 'crear'} el cliente`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} customer:`, error);
      toast.error(`Error inesperado al ${isEditing ? 'actualizar' : 'crear'} el cliente`);
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
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditing
            ? 'Modificar la información del cliente'
            : 'Registrar un nuevo cliente para recepciones en efectivo'
          }
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
          <CardDescription>
            Configure el nombre y cédula del cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                maxLength={100}
                required
              />
              <p className="text-sm text-muted-foreground">
                Nombre completo del cliente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalId">Cédula *</Label>
              <Input
                id="nationalId"
                type="text"
                placeholder="1-2345-6789"
                value={formData.nationalId}
                onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                maxLength={20}
                required
              />
              <p className="text-sm text-muted-foreground">
                Número de cédula con formato (números y guiones)
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
                    {isEditing ? 'Actualizar' : 'Crear'} Cliente
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