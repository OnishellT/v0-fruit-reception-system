"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils/pricing";
import Link from "next/link";

interface ReceptionWithPricing {
  id: string;
  reception_number: string;
  reception_date: string;
  provider: {
    name: string;
  };
  fruit_type: {
    type: string;
  };
  pricing_calculations: Array<{
    id: string;
    base_price_per_kg: number;
    total_weight: number;
    gross_value: number;
    total_discount_amount: number;
    final_total: number;
    created_at: string;
    calculation_data: {
      fruit_type: string;
      quality_metrics: Array<{
        metric: string;
        value: number;
        discount_percentage: number;
        discount_amount: number;
      }>;
      timestamp: string;
    };
  }>;
}

export function PricingHistoryClient() {
  const [loading, setLoading] = useState(true);
  const [receptions, setReceptions] = useState<ReceptionWithPricing[]>([]);
  const [filteredReceptions, setFilteredReceptions] = useState<ReceptionWithPricing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReception, setSelectedReception] = useState<ReceptionWithPricing | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load receptions with pricing
  useEffect(() => {
    loadPricingHistory();
  }, []);

  // Filter receptions based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredReceptions(receptions);
    } else {
      const filtered = receptions.filter((reception) =>
        reception.reception_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reception.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reception.fruit_type.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReceptions(filtered);
    }
  }, [searchTerm, receptions]);

  const loadPricingHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/pricing/history");
      const data = await response.json();

      if (data.success && data.data) {
        setReceptions(data.data);
        setFilteredReceptions(data.data);
      } else {
        setError(data.error || "Error al cargar el historial de precios");
      }
    } catch (error) {
      console.error("Error loading pricing history:", error);
      setError("Error al cargar el historial de precios");
    } finally {
      setLoading(false);
    }
  };

  const calculateSavings = (reception: ReceptionWithPricing) => {
    const pricing = reception.pricing_calculations[0];
    return pricing.total_discount_amount;
  };

  const calculateSavingsPercentage = (reception: ReceptionWithPricing) => {
    const pricing = reception.pricing_calculations[0];
    if (pricing.gross_value === 0) return 0;
    return (pricing.total_discount_amount / pricing.gross_value) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Cargando historial...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de recepción, proveedor o tipo de fruto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Recepciones</CardDescription>
            <CardTitle className="text-2xl">{receptions.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Con Descuentos</CardDescription>
            <CardTitle className="text-2xl">
              {receptions.filter(r => r.pricing_calculations[0]?.total_discount_amount > 0).length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ahorro Total</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(
                receptions.reduce((sum, r) => sum + calculateSavings(r), 0)
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ahorro Promedio</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(
                receptions.length > 0
                  ? receptions.reduce((sum, r) => sum + calculateSavings(r), 0) / receptions.length
                  : 0
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Receptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recepciones con Precios Calculados</CardTitle>
          <CardDescription>
            Historial de recepciones con cálculos de precios basados en calidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recepción</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Peso (KG)</TableHead>
                <TableHead className="text-right">Valor Bruto</TableHead>
                <TableHead className="text-right">Descuentos</TableHead>
                <TableHead className="text-right">Total Final</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceptions.map((reception) => {
                const pricing = reception.pricing_calculations[0];
                const savings = calculateSavings(reception);
                const savingsPercentage = calculateSavingsPercentage(reception);

                return (
                  <TableRow key={reception.id}>
                    <TableCell className="font-medium">
                      {reception.reception_number}
                    </TableCell>
                    <TableCell>
                      {new Date(reception.reception_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{reception.provider.name}</TableCell>
                    <TableCell>{reception.fruit_type.type}</TableCell>
                    <TableCell className="text-right">
                      {Number(pricing.total_weight).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(pricing.gross_value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {savings > 0 ? (
                        <div>
                          <div className="text-red-600 font-medium">
                            -{formatCurrency(savings)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ({Number(savingsPercentage).toFixed(1)}%)
                          </div>
                        </div>
                      ) : (
                        "$0.00"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(pricing.final_total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={savings > 0 ? "default" : "secondary"}
                        className={savings > 0 ? "bg-green-500" : ""}
                      >
                        {savings > 0 ? "Con descuentos" : "Sin descuentos"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/reception/${reception.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredReceptions.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm
                ? "No se encontraron recepciones que coincidan con la búsqueda"
                : "No hay recepciones con precios calculados"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
