"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Loader2, Edit, Trash2 } from "lucide-react";
import { getCashCustomers, deleteCashCustomer } from "@/lib/actions/cash/customers";
import { AdminOnly } from "@/components/ui/role-guard";
import { toast } from "sonner";

interface CustomerItem {
  id: number;
  name: string;
  nationalId: string;
  createdAt: Date;
  createdBy: string;
}

interface CustomerListProps {
  onEdit?: (customer: CustomerItem) => void;
  onCreate?: () => void;
}

export function CustomerList({ onEdit, onCreate }: CustomerListProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  // Load customers on component mount and when search changes
  useEffect(() => {
    loadCustomers();
  }, [searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const result = await getCashCustomers({
        search: searchTerm || undefined,
        limit: 50,
      });

      if (result.success && result.data) {
        setCustomers(result.data);
      } else {
        toast.error(result.error || "Error al cargar los clientes");
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error("Error al cargar los clientes");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId: number, customerName: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar al cliente "${customerName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setDeleting(customerId);
      const result = await deleteCashCustomer({ id: customerId });

      if (result.success) {
        toast.success("Cliente eliminado exitosamente");
        await loadCustomers(); // Reload the list
      } else {
        toast.error(result.error || "Error al eliminar el cliente");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Error inesperado al eliminar el cliente");
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
              <Users className="w-4 h-4 mr-2" />
              Clientes Registrados
            </CardTitle>
            <CardDescription>
              Lista de todos los clientes registrados en el sistema
            </CardDescription>
          </div>
          {onCreate && (
            <Button onClick={onCreate}>
              Nuevo Cliente
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nombre o cédula..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead>Registrado Por</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">Cargando clientes...</p>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm ? "No se encontraron clientes con ese criterio de búsqueda." : "No hay clientes registrados aún."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="font-mono">{customer.nationalId}</TableCell>
                    <TableCell>{new Date(customer.createdAt).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell>{customer.createdBy}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(customer)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <AdminOnly>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(customer.id, customer.name)}
                            disabled={deleting === customer.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {deleting === customer.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-1" />
                                Eliminar
                              </>
                            )}
                          </Button>
                        </AdminOnly>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {!loading && customers.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {customers.length} cliente{customers.length !== 1 ? 's' : ''}
            {searchTerm && ` para "${searchTerm}"`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}