"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/data-table";

interface User {
  id: string;
  username: string;
  role: "admin" | "user";
  created_at: string;
  is_active: boolean;
}

export default function UserManagementTableClient({
  users,
}: {
  users: User[];
}) {
  const router = useRouter();

  const columns: Column<User>[] = [
    {
      key: "username",
      label: "Usuario",
      sortable: true,
      searchable: true,
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: "role",
      label: "Rol",
      sortable: true,
      searchable: true,
      render: (value) => (
        <Badge variant={value === "admin" ? "default" : "secondary"}>
          {value === "admin" ? "Administrador" : "Usuario"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Fecha de Creación",
      sortable: true,
      searchable: false,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "is_active",
      label: "Estado",
      sortable: true,
      searchable: false,
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Activo" : "Inactivo"}
        </Badge>
      ),
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
            onClick={() => router.push(`/dashboard/users/${row.id}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      searchPlaceholder="Buscar por usuario o rol..."
      pageSize={10}
      emptyMessage="No hay usuarios registrados"
    />
  );
}
