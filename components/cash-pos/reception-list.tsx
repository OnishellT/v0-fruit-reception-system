"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Search, Filter, Edit, Trash2, Eye, Loader2, Plus } from "lucide-react";
import { getCashReceptions, deleteCashReception } from "@/lib/actions/cash/receptions";
import { getCashFruitTypes } from "@/lib/actions/cash/fruit-types";
import { getCashCustomers } from "@/lib/actions/cash/customers";
import { toast } from "sonner";

interface FruitType {
  id: number;
  code: string;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  nationalId: string;
}

interface CashReception {
  id: number;
  fruitTypeId: number;
  customerId: number;
  receptionDate: Date;
  containersCount: number;
  totalWeightKgOriginal: string;
  pricePerKgSnapshot: string;
  calidadHumedad?: string | null;
  calidadMoho?: string | null;
  calidadVioletas?: string | null;
  discountPercentTotal: string;
  discountWeightKg: string;
  totalWeightKgFinal: string;
  grossAmount: string;
  netAmount: string;
  discountBreakdown: any;
  createdAt: Date;
  createdBy: string;
  fruitType?: {
    code: string;
    name: string;
  };
  customer?: {
    name: string;
    nationalId: string;
  };
}

export function ReceptionList() {
  const [receptions, setReceptions] = useState<CashReception[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    fruit_type_id: "",
    customer_id: "",
    start_date: "",
    end_date: "",
    search: "",
  });

  const [fruitTypes, setFruitTypes] = useState<FruitType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadFiltersData();
    loadReceptions();
  }, []);

  // Reload receptions when filters change
  useEffect(() => {
    loadReceptions();
  }, [filters]);

  const loadFiltersData = async () => {
    try {
      const [fruitTypesResult, customersResult] = await Promise.all([
        getCashFruitTypes({ enabled_only: true }),
        getCashCustomers(),
      ]);

      if (fruitTypesResult.success && fruitTypesResult.data) {
        setFruitTypes(fruitTypesResult.data);
      }

      if (customersResult.success && customersResult.data) {
        setCustomers(customersResult.data);
      }
    } catch (error) {
      console.error("Error cargando datos de filtros:", error);
    }
  };

  const loadReceptions = async () => {
    try {
      setLoading(true);
      const queryFilters: any = {};

      if (filters.fruit_type_id) queryFilters.fruit_type_id = parseInt(filters.fruit_type_id);
      if (filters.customer_id) queryFilters.customer_id = parseInt(filters.customer_id);
      if (filters.start_date) queryFilters.start_date = filters.start_date;
      if (filters.end_date) queryFilters.end_date = filters.end_date;
      if (filters.search) queryFilters.search = filters.search;

      const result = await getCashReceptions(queryFilters);

      if (result.success && result.data) {
        setReceptions(result.data);
        setTotal(result.total || 0);
      } else {
        toast.error(result.error || "Error al cargar recepciones");
        setReceptions([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error cargando recepciones:", error);
      toast.error("Error al cargar recepciones");
      setReceptions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const deleteReception = async (receptionId: number) => {
    try {
      setDeleting(receptionId);
      const result = await deleteCashReception({ id: receptionId });

      if (result.success) {
        toast.success("Recepción eliminada exitosamente");
        await loadReceptions();
      } else {
        toast.error(result.error || "Error al eliminar la recepción");
      }
    } catch (error) {
      console.error("Error eliminando recepción:", error);
      toast.error("Error inesperado al eliminar la recepción");
    } finally {
      setDeleting(null);
    }
  };

  const formatCurrency = (amount: string) => {
    return `RD$ ${parseFloat(amount).toFixed(2)}`;
  };

  const formatWeight = (weight: string) => {
    return `${parseFloat(weight).toFixed(3)} kg`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-DO');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Recepciones de Efectivo</CardTitle>
            <CardDescription>
              Lista de todas las recepciones de fruta procesadas
            </CardDescription>
          </div>
          <Button onClick={() => window.location.href = '/dashboard/cash-pos/receptions/new'}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Recepción
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por cliente o tipo de fruta..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.fruit_type_id}
              onValueChange={(value) => setFilters(prev => ({ ...prev, fruit_type_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de fruta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {fruitTypes.map((type, index) => (
                  <SelectItem key={`fruit-type-${type.id}-${index}`} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.customer_id}
              onValueChange={(value) => setFilters(prev => ({ ...prev, customer_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Fecha inicio"
              value={filters.start_date}
              onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
            />

            <Input
              type="date"
              placeholder="Fecha fin"
              value={filters.end_date}
              onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-muted-foreground">
          {loading ? (
            "Cargando recepciones..."
          ) : (
            `Mostrando ${receptions.length} de ${total} recepciones`
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo de Fruta</TableHead>
                <TableHead>Peso Original</TableHead>
                <TableHead>Peso Final</TableHead>
                <TableHead>Monto Neto</TableHead>
                <TableHead>Contenedores</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">Cargando recepciones...</p>
                  </TableCell>
                </TableRow>
              ) : receptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">No se encontraron recepciones con los filtros aplicados.</p>
                  </TableCell>
                </TableRow>
              ) : (
                receptions.map((reception) => (
                  <TableRow key={reception.id}>
                    <TableCell>{formatDate(reception.receptionDate)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reception.customer?.name}</p>
                        <p className="text-sm text-muted-foreground">{reception.customer?.nationalId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{reception.fruitType?.name}</TableCell>
                    <TableCell className="font-mono">{formatWeight(reception.totalWeightKgOriginal)}</TableCell>
                    <TableCell className="font-mono">{formatWeight(reception.totalWeightKgFinal)}</TableCell>
                    <TableCell className="font-mono font-semibold text-green-600">
                      {formatCurrency(reception.netAmount)}
                    </TableCell>
                    <TableCell>{reception.containersCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/dashboard/cash-pos/receptions/${reception.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/dashboard/cash-pos/receptions/${reception.id}/edit`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <ConfirmDialog
                          title="¿Eliminar Recepción?"
                          description={`Esta acción no se puede deshacer. La recepción de ${reception.customer?.name} será eliminada permanentemente.`}
                          confirmText="Eliminar"
                          cancelText="Cancelar"
                          variant="destructive"
                          onConfirm={() => deleteReception(reception.id)}
                        >
                          <Button variant="outline" size="sm" disabled={deleting === reception.id}>
                            {deleting === reception.id ? (
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