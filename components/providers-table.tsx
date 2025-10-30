"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProvider } from "@/lib/actions/providers";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";

interface Provider {
  id: string;
  code: string;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  asociacion?: {
    code: string;
    name: string;
  } | null;
}

export function ProvidersTable({
  providers,
  showAsociacion = true,
}: {
  providers: Provider[];
  showAsociacion?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;

    const query = searchQuery.toLowerCase();
    return providers.filter((provider) => {
      const searchableFields = [
        provider.code,
        provider.name,
        provider.contact,
        provider.phone,
        provider.address,
        provider.asociacion?.name,
        provider.asociacion?.code,
      ];

      return searchableFields.some((field) =>
        field ? String(field).toLowerCase().includes(query) : false,
      );
    });
  }, [providers, searchQuery]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteProvider(id);
      router.refresh();
    } catch (error) {
      alert("Error al eliminar proveedor");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar por código, nombre, contacto..."
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              {showAsociacion && <TableHead>Asociación</TableHead>}
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProviders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showAsociacion ? 6 : 5}
                  className="text-center text-gray-500"
                >
                  {searchQuery
                    ? "No se encontraron proveedores"
                    : "No hay proveedores registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.code}</TableCell>
                  <TableCell>{provider.name}</TableCell>
                  {showAsociacion && (
                    <TableCell>
                      {provider.asociacion ? (
                        <Badge variant="outline">
                          {provider.asociacion.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{provider.contact || "-"}</TableCell>
                  <TableCell>{provider.phone || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/proveedores/${provider.id}`)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDialog
                        title="¿Eliminar proveedor?"
                        description="¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer."
                        confirmText="Eliminar"
                        variant="destructive"
                        onConfirm={() => handleDelete(provider.id)}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleting === provider.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
