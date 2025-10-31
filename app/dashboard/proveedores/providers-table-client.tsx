"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProvider } from "@/lib/actions/providers";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Column } from "@/components/data-table";

interface Provider {
  id: string;
  code: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  asociacion?: {
    code: string;
    name: string;
  } | null;
}

export default function ProvidersTableClient({
  providers,
  showAsociacion = true,
}: {
  providers: Provider[];
  showAsociacion?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const columns: Column<Provider>[] = [
    {
      key: "code",
      label: "Código",
      sortable: true,
      searchable: true,
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: "name",
      label: "Nombre",
      sortable: true,
      searchable: true,
    },
    ...(showAsociacion
      ? [
          {
            key: "asociacion.name",
            label: "Asociación",
            sortable: true,
            searchable: true,
            render: (_, row) =>
              row.asociacion ? (
                <Badge variant="outline">{row.asociacion.name}</Badge>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              ),
          },
        ]
      : []),
    {
      key: "contact_person",
      label: "Contacto",
      sortable: true,
      searchable: true,
      render: (value) => value || "-",
    },
    {
      key: "phone",
      label: "Teléfono",
      sortable: true,
      searchable: true,
      render: (value) => value || "-",
    },
    {
      key: "actions",
      label: "Acciones",
      sortable: false,
      searchable: false,
      align: "right",
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/proveedores/${row.id}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            title="¿Eliminar proveedor?"
            description="¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer."
            confirmText="Eliminar"
            variant="destructive"
            onConfirm={() => handleDelete(row.id)}
          >
            <Button variant="ghost" size="sm" disabled={deleting === row.id}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </ConfirmDialog>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={providers}
      columns={columns}
      searchPlaceholder="Buscar por código, nombre, contacto..."
      pageSize={10}
      emptyMessage="No hay proveedores registrados"
    />
  );
}
