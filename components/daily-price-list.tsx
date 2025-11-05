"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleLeft, ToggleRight, History, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FruitType {
  id: string;
  type: string;
  subtype: string;
}

interface DailyPrice {
  id: string;
  fruitTypeId: string;
  priceDate: string;
  pricePerKg: string;
  createdAt: Date;
  createdBy: string;
  active: boolean;
  fruitType?: {
    type: string;
    subtype: string;
  };
}

interface DailyPriceListProps {
  fruitTypes: FruitType[];
}

export function DailyPriceList({ fruitTypes }: DailyPriceListProps) {
  const [selectedFruitType, setSelectedFruitType] = useState<string>("all");
  const [priceHistory, setPriceHistory] = useState<DailyPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Load price history on component mount and when fruit type changes
  useEffect(() => {
    loadPriceHistory();
  }, [selectedFruitType]);

  const loadPriceHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFruitType !== "all") {
        params.append("fruit_type_id", selectedFruitType);
      }
      params.append("active_only", "false");

      const result = await fetch(`/api/pricing/daily?${params}`, {
        credentials: "include"
      });

      const data = await result.json();

      if (data.success && data.data) {
        setPriceHistory(data.data);
      } else {
        toast.error(data.error || "Error al cargar historial de precios");
        setPriceHistory([]);
      }
    } catch (error) {
      console.error("Error loading price history:", error);
      toast.error("Error al cargar historial de precios");
      setPriceHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePriceStatus = async (priceId: string, currentActive: boolean) => {
    try {
      setToggling(priceId);
      const result = await fetch(`/api/pricing/daily/${priceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ active: !currentActive }),
      });

      const data = await result.json();

      if (data.success) {
        toast.success(`Precio ${!currentActive ? 'activado' : 'desactivado'} exitosamente`);
        // Reload the price history to reflect the change
        await loadPriceHistory();
      } else {
        toast.error(data.error || "Error al actualizar estado del precio");
      }
    } catch (error) {
      console.error("Error toggling price status:", error);
      toast.error("Error al actualizar estado del precio");
    } finally {
      setToggling(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center">
              <History className="w-4 h-4 mr-2" />
              Historial de Precios Diarios
            </CardTitle>
            <CardDescription>
              Datos históricos de precios y gestión de estados
            </CardDescription>
          </div>
          <Select value={selectedFruitType} onValueChange={setSelectedFruitType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Tipos de Fruta</SelectItem>
              {fruitTypes.map((type, index) => (
                <SelectItem key={`fruit-type-${type.id}-${index}`} value={type.id}>
                  {type.type} - {type.subtype}
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
                 <TableHead>Fecha</TableHead>
                 <TableHead>Precio (RD$/kg)</TableHead>
                 <TableHead>Estado</TableHead>
                 <TableHead>Creado Por</TableHead>
                 <TableHead>Creado En</TableHead>
                 <TableHead>Acciones</TableHead>
               </TableRow>
             </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                     <p className="text-muted-foreground mt-2">Cargando historial de precios...</p>
                  </TableCell>
                </TableRow>
              ) : priceHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                     <p className="text-muted-foreground">No se encontró historial de precios para el filtro seleccionado.</p>
                  </TableCell>
                </TableRow>
              ) : (
                priceHistory.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell className="font-medium">
                      {price.fruitType?.type} - {price.fruitType?.subtype}
                    </TableCell>
                    <TableCell>{new Date(price.priceDate).toLocaleDateString('es-DO')}</TableCell>
                    <TableCell className="font-mono">RD$ {parseFloat(price.pricePerKg).toFixed(2)}</TableCell>
                    <TableCell>
                       <Badge variant={price.active ? "default" : "secondary"}>
                         {price.active ? "Activo" : "Inactivo"}
                       </Badge>
                    </TableCell>
                    <TableCell>{price.createdBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(price.createdAt).toLocaleString('es-DO')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePriceStatus(price.id, price.active)}
                        disabled={toggling === price.id}
                      >
                        {toggling === price.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                         ) : price.active ? (
                           <>
                             <ToggleRight className="w-4 h-4 mr-1" />
                             Desactivar
                           </>
                         ) : (
                           <>
                             <ToggleLeft className="w-4 h-4 mr-1" />
                             Activar
                           </>
                         )}
                      </Button>
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