"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { deleteDriver } from "@/lib/actions/drivers";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Column } from "@/components/data-table";

interface Driver {
  id: string;
  name: string;
  license_number: string;
  phone: string | null;
}

export default function DriversTableClient({
  drivers,
}: {
  drivers: Driver[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteDriver(id);
      router.refresh();
    } catch (error) {
      alert("Error al eliminar chofer");
    } finally {
      setDeleting(null);
    }
  };

  const columns: Column<Driver>[] = [
    {
      key: "name",
      label: "Nombre",
      sortable: true,
      searchable: true,
    },
    {
      key: "license_number",
      label: "Número de Licencia",
      sortable: true,
      searchable: true,
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
            onClick={() => router.push(`/dashboard/choferes/${row.id}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            title="¿Eliminar chofer?"
            description="¿Está seguro de que desea eliminar este chofer? Esta acción no se puede deshacer."
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
      data={drivers}
      columns={columns}
      searchPlaceholder="Buscar por nombre o número de licencia..."
      pageSize={10}
      emptyMessage="No hay choferes registrados"
    />
  );
}
