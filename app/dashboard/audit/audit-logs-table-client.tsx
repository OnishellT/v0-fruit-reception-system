"use client";

import { DataTable, Column } from "@/components/data-table";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
  user?: {
    username: string;
  } | null;
}

export default function AuditLogsTableClient({
  logs,
}: {
  logs: AuditLog[];
}) {
  const columns: Column<AuditLog>[] = [
    {
      key: "created_at",
      label: "Fecha",
      sortable: true,
      searchable: false,
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: "user.username",
      label: "Usuario",
      sortable: true,
      searchable: true,
      render: (_, row) => row.user?.username || "Sistema",
    },
    {
      key: "action",
      label: "Acción",
      sortable: true,
      searchable: true,
      render: (value) => (
        <span className="capitalize">{value.toLowerCase()}</span>
      ),
    },
    {
      key: "table_name",
      label: "Tabla",
      sortable: true,
      searchable: true,
      render: (value) => value || "-",
    },
    {
      key: "record_id",
      label: "ID Registro",
      sortable: true,
      searchable: true,
      render: (value) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{value || "-"}</code>
      ),
    },
  ];

  return (
    <DataTable
      data={logs}
      columns={columns}
      searchPlaceholder="Buscar por usuario, acción o tabla..."
      pageSize={10}
      emptyMessage="No hay registros de auditoría"
    />
  );
}
