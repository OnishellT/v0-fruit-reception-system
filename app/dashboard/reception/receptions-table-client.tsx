"use client";

import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DataTable, Column } from "@/components/data-table";
import { QualityEvaluationModal } from "@/components/quality-evaluation-modal";
import type { QualityEvaluation } from "@/lib/types/quality-universal";

interface Reception {
  id: string;
  reception_number: string;
  provider_id: string;
  driver_id: string;
  fruit_type_id: string;
  truck_plate: string;
  total_containers: number;
  total_peso_final?: number;
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
  quality_evaluations?: QualityEvaluation[];
  pricing_calculation_id?: string;
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
  const [selectedQuality, setSelectedQuality] = useState<QualityEvaluation | null>(null);

  const handleQualityButtonClick = (reception: Reception) => {
    console.log('🔍 Quality button clicked for reception:', reception.id);
    console.log('🔍 Quality evaluations found:', reception.quality_evaluations);

    setSelectedReception(reception);
    const quality = reception.quality_evaluations && reception.quality_evaluations.length > 0
      ? reception.quality_evaluations[0]
      : null;
    console.log('🔍 Setting selectedQuality to:', quality);
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
      key: "total_peso_final",
      label: "Peso Total (kg)",
      sortable: true,
      searchable: false,
      align: "right",
      render: (_, row) => (Number(row.total_peso_final) || 0).toFixed(2),
    },
    {
      key: "created_at",
      label: "Fecha",
      sortable: true,
      searchable: false,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "pricing",
      label: "Precio",
      sortable: false,
      searchable: false,
      align: "center",
      render: (_, row) => {
        if (row.pricing_calculation_id) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Calculado
            </span>
          );
        } else if (row.quality_evaluations && row.quality_evaluations.length > 0) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pendiente
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Sin evaluación
          </span>
        );
      },
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
            variant="default"
            size="sm"
            onClick={() => handleQualityButtonClick(row)}
          >
            {row.quality_evaluations && row.quality_evaluations.length > 0
              ? (userRole === "admin" ? "Editar Calidad" : "Ver Calidad")
              : "Registrar Calidad"}
          </Button>
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
        searchPlaceholder="Buscar por número o proveedor..."
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
