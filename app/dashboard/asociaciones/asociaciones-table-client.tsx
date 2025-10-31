"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { deleteAsociacion } from "@/lib/actions/asociaciones";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Column } from "@/components/data-table";

interface Asociacion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  providers_count: number;
}

export default function AsociacionesTableClient({
  asociaciones,
}: {
  asociaciones: Asociacion[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteAsociacion(id);
      router.refresh();
    } catch (error) {
      alert("Error al eliminar asociación");
    } finally {
      setDeleting(null);
    }
  };

  const columns: Column<Asociacion>[] = [
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
    {
      key: "description",
      label: "Descripción",
      sortable: true,
      searchable: true,
      render: (value) => value || "-",
    },
    {
      key: "providers_count",
      label: "Proveedores",
      sortable: true,
      searchable: false,
      align: "right",
      render: (value) => <span className="font-medium">{value}</span>,
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
            onClick={() => router.push(`/dashboard/asociaciones/${row.id}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            title="¿Eliminar asociación?"
            description="¿Está seguro de que desea eliminar esta asociación? Esta acción no se puede deshacer."
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
      data={asociaciones}
      columns={columns}
      searchPlaceholder="Buscar por código, nombre o descripción..."
      pageSize={10}
      emptyMessage="No hay asociaciones registradas"
    />
  );
}
