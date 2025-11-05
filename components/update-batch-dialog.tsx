'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UpdateBatchForm } from './update-batch-form';
import { CacaoBatch } from '@/lib/types/cacao';

interface UpdateBatchDialogProps {
  batch: CacaoBatch;
  onSuccess?: () => void;
}

export function UpdateBatchDialog({ batch, onSuccess }: UpdateBatchDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Actualizar Lote</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Actualizar Lote de Cacao</DialogTitle>
          <DialogDescription>
            Actualizar el peso seco final para este lote de cacao.
          </DialogDescription>
        </DialogHeader>
        <UpdateBatchForm batch={batch} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
