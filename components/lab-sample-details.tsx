import { LaboratorySample } from "@/lib/types/cacao";

interface LabSampleDetailsProps {
  sample: LaboratorySample;
}

export function LabSampleDetails({ sample }: LabSampleDetailsProps) {
  const isCompleted = sample.status === "Result Entered";

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    if (status === "Result Entered") {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-yellow-100 text-yellow-800`;
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Muestra de Laboratorio</h3>
        <span className={getStatusBadge(sample.status)}>
          {sample.status === "Result Entered" ? "✓ Completada" : "⏳ Pendiente"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <p>
          <strong>Peso de Muestra:</strong> {sample.sample_weight} kg
        </p>
        <p>
          <strong>Días de Secado:</strong> {sample.estimated_drying_days}
        </p>
      </div>

      {isCompleted && (
        <>
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium mb-2">
              ✓ Resultados Enviados
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {sample.dried_sample_kg && (
                <p>
                  <strong>Peso Seco:</strong> {sample.dried_sample_kg} kg
                </p>
              )}
              {sample.violetas_percentage && (
                <p>
                  <strong>Violetas:</strong> {sample.violetas_percentage}%
                </p>
              )}
              {sample.moho_percentage && (
                <p>
                  <strong>Moho:</strong> {sample.moho_percentage}%
                </p>
              )}
              {sample.basura_percentage && (
                <p>
                  <strong>Basura:</strong> {sample.basura_percentage}%
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {!isCompleted && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            ⏳ Esperando peso seco y resultados de calidad. Esta muestra aún no
            ha sido completada.
          </p>
        </div>
      )}
    </div>
  );
}
