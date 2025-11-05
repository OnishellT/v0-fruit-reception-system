'use client';

import { CacaoBatch } from '@/lib/types/cacao';
import { BatchDetails } from './batch-details';
import { UpdateBatchDialog } from './update-batch-dialog';

interface BatchesListProps {
  batches: CacaoBatch[];
  onBatchUpdated?: () => void;
}

export function BatchesList({ batches, onBatchUpdated }: BatchesListProps) {
  if (batches.length === 0) {
    return <p>No se encontraron lotes de cacao.</p>;
  }

  return (
    <div className="grid gap-4">
      {batches.map((batch) => (
        <div key={batch.id} className="border p-4 rounded-md shadow-sm">
          <BatchDetails batch={batch} />
          <div className="mt-4">
            <UpdateBatchDialog batch={batch} onSuccess={onBatchUpdated} />
          </div>
        </div>
      ))}
    </div>
  );
}
