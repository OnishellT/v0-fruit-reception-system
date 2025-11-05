"use client";

import { useState, useEffect } from "react";
import { CacaoBatch } from "@/lib/types/cacao";
import { BatchProgressDashboard } from "@/components/batch-progress-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Package, List } from "lucide-react";
import { DataTable, Column } from "@/components/data-table";

interface Reception {
  id: string;
  reception_number: string;
  total_weight: number;
  fruit_type: string;
  fruit_subtype: string;
  total_peso_original: number;
  f_batch_id?: string;
}

export function BatchesClient() {
  const [loading, setLoading] = useState(true);
  const [availableReceptions, setAvailableReceptions] = useState<Reception[]>([]);
  const [batches, setBatches] = useState<CacaoBatch[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load available cacao receptions and batches
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load available cacao receptions (not in batches)
      const receptionsResponse = await fetch('/api/receptions?limit=100');
      if (receptionsResponse.ok) {
        const receptionsData = await receptionsResponse.json();

        // Filter for cacao verde receptions that aren't already in a batch and have weight
        const cacaoReceptions = receptionsData.filter((r: any) =>
          r.fruit_type === 'CACAO' &&
          r.fruit_subtype === 'Verde' &&
          !r.f_batch_id &&
          r.total_peso_original > 0
        );
        setAvailableReceptions(cacaoReceptions);
      }

      // Load batches
      const batchesResponse = await fetch('/api/batches');
      if (batchesResponse.ok) {
        const batchesData = await batchesResponse.json();
        setBatches(batchesData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: "error", text: "Error al cargar los datos" });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchCreated = () => {
    setMessage({ type: "success", text: "Lote de cacao creado exitosamente" });
    loadData(); // Reload data to update available receptions and batches
    setTimeout(() => setMessage(null), 3000);
  };

  const handleBatchUpdated = () => {
    setMessage({ type: "success", text: "Lote de cacao actualizado exitosamente" });
    loadData(); // Reload data to update batch status
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-500" : "border-red-500"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-700" : "text-red-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Recepciones Disponibles ({availableReceptions.length})
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lotes Activos ({batches.filter(b => b.status === 'In progress').length})
          </TabsTrigger>
        </TabsList>

        {/* Available Receptions Tab */}
        <TabsContent value="available">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Recepciones de Cacao Disponibles</h3>
              <p className="text-sm text-muted-foreground">
                Selecciona las recepciones de cacao verde que deseas incluir en un nuevo lote de procesamiento.
                Solo se muestran recepciones que no están asignadas a ningún lote activo.
              </p>
            </div>
            <AvailableReceptionsTable
              receptions={availableReceptions}
              onBatchCreated={handleBatchCreated}
            />
          </div>
        </TabsContent>

        {/* Batches Tab */}
        <TabsContent value="batches">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Lotes de Procesamiento Activos</h3>
              <p className="text-sm text-muted-foreground">
                Gestiona y monitorea el progreso de los lotes de secado y fermentación activos.
                Usa la búsqueda para incluir lotes completados en los resultados.
              </p>
            </div>
            <BatchProgressDashboard onBatchUpdated={handleBatchUpdated} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for available receptions table with batch creation
function AvailableReceptionsTable({
  receptions,
  onBatchCreated
}: {
  receptions: Reception[];
  onBatchCreated: () => void;
}) {
  const [selectedReceptions, setSelectedReceptions] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleReceptionToggle = (receptionId: string, checked: boolean) => {
    setSelectedReceptions(prev =>
      checked
        ? [...prev, receptionId]
        : prev.filter(id => id !== receptionId)
    );
  };

  const handleCreateBatch = () => {
    setShowCreateDialog(true);
  };

  // Define columns for the DataTable
  const columns: Column<Reception>[] = [
    {
      key: "select",
      label: "Seleccionar",
      sortable: false,
      searchable: false,
      align: "center",
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedReceptions.includes(row.id)}
          onChange={(e) => handleReceptionToggle(row.id, e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
    },
    {
      key: "reception_number",
      label: "Recepción",
      sortable: true,
      searchable: true,
    },
    {
      key: "fruit_subtype",
      label: "Tipo",
      sortable: true,
      searchable: false,
      render: (_, row) => row.fruit_subtype || 'CACAO',
    },
    {
      key: "total_peso_original",
      label: "Peso (kg)",
      sortable: true,
      searchable: false,
      align: "right",
      render: (_, row) => (Number(row.total_peso_original) || 0).toFixed(2),
    },
    {
      key: "created_at",
      label: "Fecha",
      sortable: true,
      searchable: false,
      render: () => new Date().toLocaleDateString(), // You might want to add created_at to the query
    },
  ];

  if (receptions.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          No hay recepciones de cacao disponibles para crear lotes.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Las recepciones deben tener tipo "CACAO" y no estar asignadas a ningún lote activo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection Summary */}
      {selectedReceptions.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
          <div>
            <p className="font-medium">
              {selectedReceptions.length} recepción(es) seleccionada(s)
            </p>
            <p className="text-sm text-muted-foreground">
               Peso total: {receptions
                 .filter(r => selectedReceptions.includes(r.id))
                 .reduce((sum, r) => sum + (Number(r.total_peso_original) || 0), 0)
                 .toFixed(2)} kg
            </p>
          </div>
          <button
            onClick={handleCreateBatch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Crear Lote
          </button>
        </div>
      )}

      {/* Select All Checkbox */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          id="select-all"
          checked={selectedReceptions.length === receptions.length && receptions.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedReceptions(receptions.map(r => r.id));
            } else {
              setSelectedReceptions([]);
            }
          }}
          className="rounded border-gray-300"
        />
        <label htmlFor="select-all" className="text-sm font-medium">
          Seleccionar todas las recepciones
        </label>
      </div>

      {/* Receptions Table with Search */}
      <DataTable
        data={receptions}
        columns={columns}
        searchPlaceholder="Buscar por número de recepción..."
        pageSize={10}
        emptyMessage="No hay recepciones disponibles"
      />

      {/* Create Batch Dialog */}
      {showCreateDialog && (
        <CreateBatchDialog
          selectedReceptions={selectedReceptions}
          receptions={receptions}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            setSelectedReceptions([]);
            onBatchCreated();
          }}
        />
      )}
    </div>
  );
}

// Simple create batch dialog component
function CreateBatchDialog({
  selectedReceptions,
  receptions,
  onClose,
  onSuccess
}: {
  selectedReceptions: string[];
  receptions: Reception[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    batch_type: 'Drying',
    start_date: new Date().toISOString().slice(0, 16), // Keep for datetime-local input
    duration: '7'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Convert datetime-local format to full ISO string
      const startDate = new Date(formData.start_date);
      const isoStartDate = startDate.toISOString();

      const requestData = {
        ...formData,
        start_date: isoStartDate,
        duration: parseInt(formData.duration) || 7, // Default to 7 if parsing fails
        reception_ids: selectedReceptions
      };

      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error('Error al crear el lote');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Error al crear el lote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Crear Nuevo Lote</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Lote</label>
            <select
              value={formData.batch_type}
              onChange={(e) => setFormData(prev => ({ ...prev, batch_type: e.target.value }))}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="Drying">Secado</option>
              <option value="Fermentation">Fermentación</option>
              <option value="Fermentation + Drying">Fermentación + Secado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha de Inicio</label>
            <input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Duración (días)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow positive numbers or empty string
                if (value === '' || (!isNaN(Number(value)) && Number(value) > 0)) {
                  setFormData(prev => ({ ...prev, duration: value }));
                }
              }}
              className="w-full p-2 border rounded-md"
              min="1"
              required
              placeholder="7"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Creando...' : 'Crear Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}