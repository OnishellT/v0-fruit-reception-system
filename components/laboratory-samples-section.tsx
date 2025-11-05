'use client';

import { useEffect, useState } from 'react';
import { LabSamplesList } from './lab-samples-list';
import { CreateLabSampleDialog } from './create-lab-sample-dialog';
import { LaboratorySample } from '@/lib/types/cacao';

import { toast } from 'sonner';

interface LaboratorySamplesSectionProps {
  receptionId: string;
}

export function LaboratorySamplesSection({ receptionId }: LaboratorySamplesSectionProps) {
  const [samples, setSamples] = useState<LaboratorySample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      // This getLaboratorySamples needs to be a client-side function that calls the API route
      // For now, I will assume it exists and fetches from /api/receptions/[receptionId]/samples
      const response = await fetch(`/api/receptions/${receptionId}/samples`);
      if (!response.ok) {
        throw new Error('Failed to fetch laboratory samples');
      }
      const fetchedSamples = await response.json();
      setSamples(fetchedSamples);
    } catch (err) {
      setError((err as Error).message);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [receptionId]);

  if (loading) {
    return <div>Cargando muestras de laboratorio...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <LabSamplesList samples={samples} onSampleUpdated={fetchSamples} />
      <div className="mt-4">
        <CreateLabSampleDialog
          receptionId={receptionId}
          onSuccess={fetchSamples}
          disabled={samples.length > 0} // Disable if samples exist
        />
      </div>
    </div>
  );
}
