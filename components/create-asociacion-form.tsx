"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAsociacion } from "@/lib/actions/asociaciones";
import { ArrowLeft } from "lucide-react";

export function CreateAsociacionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await createAsociacion(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      // Brief delay to show success message before redirect
      setTimeout(() => {
        router.push("/dashboard/asociaciones");
        router.refresh();
      }, 1500);
    } catch (error: any) {
      setError(error.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Asociación</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-800 px-4 py-3 rounded-md mb-4 border border-green-200">
            ✅ Asociación creada exitosamente. Redirigiendo...
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                name="code"
                required
                disabled={loading || success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                required
                disabled={loading || success}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                disabled={loading || success}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading || success}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading ? "Creando..." : success ? "Creada exitosamente" : "Crear Asociación"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
