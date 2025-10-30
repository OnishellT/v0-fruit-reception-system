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
import { createFruitType } from "@/lib/actions/fruit-types";
import { ArrowLeft } from "lucide-react";

export function CreateFruitTypeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await createFruitType(formData);
      router.push("/dashboard/tipos-fruto");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Tipo de Fruto</CardTitle>
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
              <Label htmlFor="type">Tipo *</Label>
              <Select name="type" required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CACAO">CACAO</SelectItem>
                  <SelectItem value="CAFÉ">CAFÉ</SelectItem>
                  <SelectItem value="MIEL">MIEL</SelectItem>
                  <SelectItem value="COCOS">COCOS</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Valores válidos: CACAO, CAFÉ, MIEL, COCOS
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtype">Subtipo *</Label>
              <Input
                id="subtype"
                name="subtype"
                placeholder="ej: Convencional"
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" />
            </div>
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
              {loading ? "Creando..." : "Crear Tipo de Fruto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
