"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { getCashFruitTypes, updateCashFruitType } from "@/lib/actions/cash/fruit-types";
import { toast } from "sonner";

interface FruitType {
  id: number;
  code: string;
  name: string;
  enabled: boolean;
  createdAt: Date;
}

export default function FruitTypesPage() {
  const [fruitTypes, setFruitTypes] = useState<FruitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  // Load fruit types on component mount
  useEffect(() => {
    loadFruitTypes();
  }, []);

  const loadFruitTypes = async () => {
    try {
      setLoading(true);
      const result = await getCashFruitTypes({ enabled_only: false });
      if (result.success && result.data) {
        setFruitTypes(result.data);
      } else {
        toast.error(result.error || "Failed to load fruit types");
        setFruitTypes([]);
      }
    } catch (error) {
      console.error("Error loading fruit types:", error);
      toast.error("Failed to load fruit types");
      setFruitTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFruitTypeStatus = async (fruitTypeId: number, currentEnabled: boolean) => {
    try {
      setToggling(fruitTypeId);
      const result = await updateCashFruitType({
        id: fruitTypeId,
        enabled: !currentEnabled,
      });

      if (result.success) {
        toast.success(`Fruit type ${!currentEnabled ? 'enabled' : 'disabled'} successfully`);
        await loadFruitTypes();
      } else {
        toast.error(result.error || "Failed to update fruit type status");
      }
    } catch (error) {
      console.error("Error toggling fruit type status:", error);
      toast.error("Failed to update fruit type status");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tipos de Fruta</h1>
            <p className="text-muted-foreground mt-2">
              Gestionar tipos de fruta disponibles para recepciones en efectivo
            </p>
          </div>
          <Button onClick={() => window.location.href = '/dashboard/cash-pos/fruit-types/new'}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Tipo de Fruta
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Fruta Disponibles</CardTitle>
          <CardDescription>
            Configure qué tipos de fruta están disponibles para el procesamiento de recepciones en efectivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              <p className="text-muted-foreground mt-2">Cargando tipos de fruta...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fruitTypes.map((fruitType, index) => (
                <div
                  key={`fruit-type-${fruitType.id}-${index}`}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold">{fruitType.name}</h3>
                      <p className="text-sm text-muted-foreground">Código: {fruitType.code}</p>
                    </div>
                    <Badge variant={fruitType.enabled ? "default" : "secondary"}>
                      {fruitType.enabled ? "Habilitado" : "Deshabilitado"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/cash-pos/fruit-types/${fruitType.id}/edit`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFruitTypeStatus(fruitType.id, fruitType.enabled)}
                      disabled={toggling === fruitType.id}
                    >
                      {toggling === fruitType.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : fruitType.enabled ? (
                        <>
                          <ToggleRight className="w-4 h-4 mr-2" />
                          Deshabilitar
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 mr-2" />
                          Habilitar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && fruitTypes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay tipos de fruta configurados aún.</p>
              <Button className="mt-4" onClick={() => window.location.href = '/dashboard/cash-pos/fruit-types/new'}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Tipo de Fruta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}