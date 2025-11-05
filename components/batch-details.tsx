'use client';

import { useState, useEffect } from 'react';
import { CacaoBatch } from '@/lib/types/cacao';

interface BatchDetailsProps {
  batch: CacaoBatch;
}

interface BatchReception {
  reception_id: string;
  wet_weight_contribution: number;
  percentage_of_total: number;
  proportional_dried_weight: number;
  reception_number?: string;
  fruit_subtype?: string;
}

export function BatchDetails({ batch }: BatchDetailsProps) {
  const [receptions, setReceptions] = useState<BatchReception[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate progress
  const now = new Date();
  const startDate = new Date(batch.start_date);
  const expectedCompletion = batch.expected_completion_date ? new Date(batch.expected_completion_date) : null;
  const totalDuration = expectedCompletion ? (expectedCompletion.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) : batch.duration;
  const elapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const daysRemaining = expectedCompletion ? Math.max(0, Math.ceil((expectedCompletion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;

  // Load batch receptions
  useEffect(() => {
    const loadReceptions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/batches/${batch.id}/receptions`);
        if (response.ok) {
          const data = await response.json();
          setReceptions(data);
        }
      } catch (error) {
        console.error('Failed to load batch receptions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReceptions();
  }, [batch.id]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p><strong>Tipo de Lote:</strong> {batch.batch_type}</p>
          <p><strong>Estado:</strong>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              batch.status === 'Completed' ? 'bg-green-100 text-green-800' :
              batch.status === 'In progress' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {batch.status === 'Completed' ? 'Completado' :
               batch.status === 'In progress' ? 'En Progreso' :
               batch.status}
            </span>
          </p>
        </div>
        <div>
          <p><strong>Fecha de Inicio:</strong> {new Date(batch.start_date).toLocaleDateString()}</p>
          <p><strong>Duración:</strong> {batch.duration} días</p>
        </div>
      </div>

      {/* Progress Indicator */}
      {batch.status === 'In progress' && expectedCompletion && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso</span>
            <span>{daysRemaining !== null ? `${daysRemaining} días restantes` : 'En progreso'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${daysRemaining === 0 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600">
            Finalización esperada: {expectedCompletion.toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Weight Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          {batch.total_wet_weight && <p><strong>Peso Total Húmedo:</strong> {batch.total_wet_weight.toFixed(2)} kg</p>}
        </div>
        <div>
          {batch.total_dried_weight && <p><strong>Peso Total Seco:</strong> {batch.total_dried_weight.toFixed(2)} kg</p>}
          {batch.total_sacos_70kg && batch.remainder_kg && (
            <p className="text-sm text-gray-600">
              ({batch.total_sacos_70kg} sacos × 70kg + {batch.remainder_kg}kg)
            </p>
          )}
        </div>
      </div>

      {/* Reception Contributions */}
      {receptions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">Contribuciones de Recepciones</h4>
          <div className="max-h-40 overflow-y-auto">
            {receptions.map((reception) => (
              <div key={reception.reception_id} className="flex justify-between text-sm py-1 border-b">
                <span>
                  {reception.reception_number || reception.reception_id.slice(0, 8)}...
                  {reception.fruit_subtype && ` (${reception.fruit_subtype})`}
                </span>
                <span>
                  {reception.wet_weight_contribution.toFixed(1)}kg
                  ({reception.percentage_of_total.toFixed(1)}%)
                  {reception.proportional_dried_weight > 0 && (
                    <span className="text-green-600 ml-2">
                      → {reception.proportional_dried_weight.toFixed(1)}kg
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
