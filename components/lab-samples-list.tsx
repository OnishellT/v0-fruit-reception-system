'use client';

import { LaboratorySample } from '@/lib/types/cacao';
import { LabSampleDetails } from './lab-sample-details';
import { UpdateLabSampleDialog } from './update-lab-sample-dialog';

interface LabSamplesListProps {
  samples: LaboratorySample[];
  onSampleUpdated?: () => void;
}

export function LabSamplesList({ samples, onSampleUpdated }: LabSamplesListProps) {
  if (samples.length === 0) {
    return <p>No se encontraron muestras de laboratorio para esta recepción.</p>;
  }

  return (
    <div className="grid gap-4">
      {samples.map((sample) => (
        <div key={sample.id} className="border p-4 rounded-md shadow-sm">
          <LabSampleDetails sample={sample} />
          <div className="mt-4">
            <UpdateLabSampleDialog sample={sample} onSuccess={onSampleUpdated} />
          </div>
        </div>
      ))}
    </div>
  );
}
