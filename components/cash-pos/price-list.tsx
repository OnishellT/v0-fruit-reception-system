"use client";

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleLeft, ToggleRight, History, Loader2 } from "lucide-react";
import { getDailyPrices, updateDailyPrice } from "@/lib/actions/cash/prices";
import { toast } from "sonner";

interface PriceHistoryItem {
  id: number;
  fruitTypeId: number;
  priceDate: string;
  pricePerKg: string;
  createdAt: Date;
  createdBy: string;
  active: boolean;
  fruitType?: {
    code: string;
    name: string;
  };
}

export function PriceList() {
  const [selectedFruitType, setSelectedFruitType] = useState<string>("all");
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  const fruitTypes = [
    { id: "all", name: "Todos los Tipos de Fruta" },
    { id: "1", name: "Café" },
    { id: "2", name: "Cacao" },
    { id: "3", name: "Miel" },
    { id: "4", name: "Cocos" },
  ];

  // Load price history on component mount and when fruit type changes
  useEffect(() => {
    loadPriceHistory();
  }, [selectedFruitType]);

  const loadPriceHistory = async () => {
    try {
      setLoading(true);
      const fruitTypeId = selectedFruitType === "all" ? undefined : parseInt(selectedFruitType);
      const result = await getDailyPrices({
        fruit_type_id: fruitTypeId,
        active_only: false, // Show all prices for history
      });

      if (result.success && result.data) {
        setPriceHistory(result.data);
      } else {
        toast.error(result.error || "Failed to load price history");
        setPriceHistory([]);
      }
    } catch (error) {
      console.error("Error loading price history:", error);
      toast.error("Failed to load price history");
      setPriceHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePriceStatus = async (priceId: number, currentActive: boolean) => {
    try {
      setToggling(priceId);
      const result = await updateDailyPrice({
        id: priceId,
        active: !currentActive,
      });

      if (result.success) {
        toast.success(`Price ${!currentActive ? 'activated' : 'deactivated'} successfully`);
        // Reload the price history to reflect the change
        await loadPriceHistory();
      } else {
        toast.error(result.error || "Failed to update price status");
      }
    } catch (error) {
      console.error("Error toggling price status:", error);
      toast.error("Failed to update price status");
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
              Historial de Precios
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
              {fruitTypes.map((type, index) => (
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
                      {price.fruitType?.name || `Fruit Type ${price.fruitTypeId}`}
                    </TableCell>
                    <TableCell>{new Date(price.priceDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono">RD$ {parseFloat(price.pricePerKg).toFixed(2)}</TableCell>
                    <TableCell>
                       <Badge variant={price.active ? "default" : "secondary"}>
                         {price.active ? "Activo" : "Inactivo"}
                       </Badge>
                    </TableCell>
                    <TableCell>{price.createdBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {price.createdAt.toLocaleString()}
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