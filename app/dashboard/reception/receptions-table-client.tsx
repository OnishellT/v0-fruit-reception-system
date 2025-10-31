"use client";

import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DataTable, Column } from "@/components/data-table";
import { QualityEvaluationModal } from "@/components/quality-evaluation-modal";
import type { CalidadCafe } from "@/lib/types/quality-cafe";

interface Reception {
  id: string;
  reception_number: string;
  provider_id: string;
  driver_id: string;
  fruit_type_id: string;
  truck_plate: string;
  total_containers: number;
  status: string;
  created_at: string;
  provider?: {
    code: string;
    name: string;
  };
  driver?: {
    name: string;
  };
  fruit_type?: {
    type: string;
    subtype: string;
  };
  calidad_cafe?: CalidadCafe[];
}

export default function ReceptionsTableClient({
  receptions,
  userRole,
}: {
  receptions: Reception[];
  userRole: "admin" | "operator";
}) {
  const router = useRouter();
  const [qualityModalOpen, setQualityModalOpen] = useState(false);
  const [selectedReception, setSelectedReception] = useState<Reception | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<CalidadCafe | null>(null);

  const handleQualityButtonClick = (reception: Reception) => {
    setSelectedReception(reception);
    const quality = reception.calidad_cafe && reception.calidad_cafe.length > 0 
      ? reception.calidad_cafe[0] 
      : null;
    setSelectedQuality(quality);
    setQualityModalOpen(true);
  };

  const handleQualitySaved = () => {
    router.refresh();
  };

  const handleQualityModalClose = () => {
    setQualityModalOpen(false);
    setSelectedReception(null);
    setSelectedQuality(null);
  };

  const isCafeSeco = (reception: Reception) => {
    return (
      reception.fruit_type?.type === "CAFÉ" &&
      reception.fruit_type?.subtype === "Seco"
    );
  };

  const columns: Column<Reception>[] = [
    {
      key: "reception_number",
      label: "Número",
      sortable: true,
      searchable: true,
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: "provider.code",
      label: "Proveedor",
      sortable: true,
      searchable: true,
      render: (_, row) => row.provider?.code || "-",
    },
    {
      key: "driver.name",
      label: "Chofer",
      sortable: true,
      searchable: true,
      render: (_, row) => row.driver?.name || "-",
    },
    {
      key: "truck_plate",
      label: "Placa",
      sortable: true,
      searchable: true,
    },
    {
      key: "fruit_type.subtype",
      label: "Tipo",
      sortable: true,
      searchable: false,
      render: (_, row) => {
        const type = row.fruit_type?.type || "-";
        const subtype = row.fruit_type?.subtype || "-";
        return type + " - " + subtype;
      },
    },
    {
      key: "total_containers",
      label: "Contenedores",
      sortable: true,
      searchable: false,
      align: "right",
    },
    {
      key: "created_at",
      label: "Fecha",
      sortable: true,
      searchable: false,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Acciones",
      sortable: false,
      searchable: false,
      align: "right",
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          {isCafeSeco(row) && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleQualityButtonClick(row)}
            >
              {row.calidad_cafe && row.calidad_cafe.length > 0
                ? (userRole === "admin" ? "Editar Calidad" : "Ver Calidad")
                : "Registrar Calidad"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/reception/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/reception/${row.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={receptions}
        columns={columns}
        searchPlaceholder="Buscar por número, proveedor, chofer o placa..."
        pageSize={10}
        emptyMessage="No hay recepciones registradas"
      />

      {selectedReception && (
        <QualityEvaluationModal
          recepcionId={selectedReception.id}
          reception={{
            id: selectedReception.id,
            reception_number: selectedReception.reception_number,
            fruit_type: selectedReception.fruit_type?.type || "",
            fruit_subtype: selectedReception.fruit_type?.subtype || "",
          }}
          userRole={userRole}
          existingQuality={selectedQuality}
          onSaved={handleQualitySaved}
          onClose={handleQualityModalClose}
          isOpen={qualityModalOpen}
        />
      )}
    </>
  );
}
