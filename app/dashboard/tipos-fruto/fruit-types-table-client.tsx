"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { deleteFruitType } from "@/lib/actions/fruit-types";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Column } from "@/components/data-table";

interface FruitType {
  id: string;
  type: string;
  subtype: string;
  description: string | null;
}

export default function FruitTypesTableClient({
  fruitTypes,
}: {
  fruitTypes: FruitType[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteFruitType(id);
      router.refresh();
    } catch (error) {
      alert("Error al eliminar tipo de fruto");
    } finally {
      setDeleting(null);
    }
  };

  const columns: Column<FruitType>[] = [
    {
      key: "type",
      label: "Tipo",
      sortable: true,
      searchable: true,
    },
    {
      key: "subtype",
      label: "Subtipo",
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
            onClick={() => router.push(`/dashboard/tipos-fruto/${row.id}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            title="¿Eliminar tipo de fruto?"
            description="¿Está seguro de que desea eliminar este tipo de fruto? Esta acción no se puede deshacer."
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
      data={fruitTypes}
      columns={columns}
      searchPlaceholder="Buscar por tipo, subtipo o descripción..."
      pageSize={10}
      emptyMessage="No hay tipos de fruto registrados"
    />
  );
}
