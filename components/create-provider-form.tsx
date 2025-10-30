"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProvider } from "@/lib/actions/providers";
import { ArrowLeft } from "lucide-react";

interface Asociacion {
  id: string;
  code: string;
  name: string;
}

export function CreateProviderForm({
  asociaciones,
}: {
  asociaciones: Asociacion[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await createProvider(formData);
      router.push("/dashboard/proveedores");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Error al crear proveedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Proveedor</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contacto</Label>
              <Input id="contact" name="contact" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" />
            </div>

            {asociaciones.length > 0 && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="asociacion_id">Asociación</Label>
                <Select name="asociacion_id" defaultValue="none">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una asociación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asociación</SelectItem>
                    {asociaciones.map((asociacion) => (
                      <SelectItem key={asociacion.id} value={asociacion.id}>
                        {asociacion.code} - {asociacion.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Proveedor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
