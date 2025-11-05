"use client";

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToggleLeft, ToggleRight, Edit, Trash2, Settings, Loader2 } from "lucide-react";
import { getQualityThresholds, updateQualityThreshold, deleteQualityThreshold } from "@/lib/actions/cash/quality";
import { toast } from "sonner";

interface ThresholdListProps {
  fruitTypes: Array<{ id: number; name: string; code: string }>;
}

interface QualityThreshold {
  id: number;
  fruitTypeId: number;
  metric: string;
  thresholdPercent: string;
  enabled: boolean;
  createdAt: Date;
  fruitType?: {
    code: string;
    name: string;
  };
}

export function ThresholdList({ fruitTypes }: ThresholdListProps) {
  const [thresholds, setThresholds] = useState<QualityThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFruitType, setSelectedFruitType] = useState<string>("all");
  const [editingThreshold, setEditingThreshold] = useState<QualityThreshold | null>(null);
  const [editValue, setEditValue] = useState("");
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fruitTypesWithAll = [
    { id: "all", name: "Todos los Tipos de Fruta" },
    ...fruitTypes.map(type => ({ id: type.id.toString(), name: type.name }))
  ];

  // Load thresholds on component mount and when fruit type changes
  useEffect(() => {
    loadThresholds();
  }, [selectedFruitType]);

  const loadThresholds = async () => {
    try {
      setLoading(true);
      const fruitTypeId = selectedFruitType === "all" ? undefined : parseInt(selectedFruitType);
      const result = await getQualityThresholds({
        fruit_type_id: fruitTypeId,
        enabled_only: false, // Show all thresholds for management
      });

      if (result.success && result.data) {
        setThresholds(result.data);
      } else {
        toast.error(result.error || "Failed to load quality thresholds");
        setThresholds([]);
      }
    } catch (error) {
      console.error("Error loading thresholds:", error);
      toast.error("Failed to load quality thresholds");
      setThresholds([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleThresholdStatus = async (thresholdId: number, currentEnabled: boolean) => {
    try {
      setToggling(thresholdId);
      const result = await updateQualityThreshold({
        id: thresholdId,
        enabled: !currentEnabled,
      });

      if (result.success) {
        toast.success(`Umbral ${!currentEnabled ? 'habilitado' : 'deshabilitado'} exitosamente`);
        await loadThresholds();
      } else {
        toast.error(result.error || "Failed to update threshold status");
      }
    } catch (error) {
      console.error("Error toggling threshold status:", error);
      toast.error("Failed to update threshold status");
    } finally {
      setToggling(null);
    }
  };

  const handleEditThreshold = (threshold: QualityThreshold) => {
    setEditingThreshold(threshold);
    setEditValue(threshold.thresholdPercent);
  };

  const saveThresholdEdit = async () => {
    if (!editingThreshold) return;

    const newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue < 0 || newValue > 100) {
      toast.error("El porcentaje del umbral debe estar entre 0 y 100");
      return;
    }

    try {
      const result = await updateQualityThreshold({
        id: editingThreshold.id,
        threshold_percent: newValue,
      });

      if (result.success) {
        toast.success("Umbral actualizado exitosamente");
        setEditingThreshold(null);
        setEditValue("");
        await loadThresholds();
      } else {
        toast.error(result.error || "Error al actualizar el umbral");
      }
    } catch (error) {
      console.error("Error updating threshold:", error);
      toast.error("Error inesperado al actualizar el umbral");
    }
  };

  const deleteThreshold = async (thresholdId: number) => {
    try {
      setDeleting(thresholdId);
      const result = await deleteQualityThreshold({
        id: thresholdId,
      });

      if (result.success) {
        toast.success("Umbral eliminado exitosamente");
        await loadThresholds();
      } else {
        toast.error(result.error || "Error al eliminar el umbral");
      }
    } catch (error) {
      console.error("Error deleting threshold:", error);
      toast.error("Error inesperado al eliminar el umbral");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Umbrales de Calidad
            </CardTitle>
            <CardDescription>
              Gestionar estándares de calidad para descuentos automáticos
            </CardDescription>
          </div>
          <Select value={selectedFruitType} onValueChange={setSelectedFruitType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fruitTypesWithAll.map((type, index) => (
                <SelectItem key={`fruit-type-${type.id}-${index}`} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Fruta</TableHead>
                <TableHead>Parámetro</TableHead>
                <TableHead>Umbral (%)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">Cargando umbrales...</p>
                  </TableCell>
                </TableRow>
              ) : thresholds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No hay umbrales configurados para el filtro seleccionado.</p>
                  </TableCell>
                </TableRow>
              ) : (
                thresholds.map((threshold) => (
                  <TableRow key={threshold.id}>
                    <TableCell className="font-medium">
                      {threshold.fruitType?.name || `Tipo ${threshold.fruitTypeId}`}
                    </TableCell>
                    <TableCell>{threshold.metric}</TableCell>
                    <TableCell className="font-mono">
                      {parseFloat(threshold.thresholdPercent).toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant={threshold.enabled ? "default" : "secondary"}>
                        {threshold.enabled ? "Habilitado" : "Deshabilitado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {threshold.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditThreshold(threshold)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Umbral</DialogTitle>
                              <DialogDescription>
                                Modificar el porcentaje del umbral para {threshold.metric} en {threshold.fruitType?.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Label htmlFor="edit-threshold">Nuevo Umbral (%)</Label>
                              <Input
                                id="edit-threshold"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="mt-2"
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingThreshold(null)}>
                                Cancelar
                              </Button>
                              <Button onClick={saveThresholdEdit}>
                                Guardar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleThresholdStatus(threshold.id, threshold.enabled)}
                          disabled={toggling === threshold.id}
                        >
                          {toggling === threshold.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : threshold.enabled ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </Button>

                        <ConfirmDialog
                          title="¿Eliminar Umbral?"
                          description={`Esta acción no se puede deshacer. El umbral de ${threshold.metric} para ${threshold.fruitType?.name} será eliminado permanentemente.`}
                          confirmText="Eliminar"
                          cancelText="Cancelar"
                          variant="destructive"
                          onConfirm={() => deleteThreshold(threshold.id)}
                        >
                          <Button variant="outline" size="sm" disabled={deleting === threshold.id}>
                            {deleting === threshold.id ? (
                              <Loader2 className="w-4 h-4 animate-spin w-4 h-4" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}