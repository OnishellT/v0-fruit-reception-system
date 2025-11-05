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
import { CreateBatchForm } from './create-batch-form';

interface CreateBatchDialogProps {
  onSuccess?: () => void;
}

export function CreateBatchDialog({ onSuccess }: CreateBatchDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Crear Lote de Cacao</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Lote de Cacao</DialogTitle>
          <DialogDescription>
            Crear un nuevo lote de cacao a partir de recepciones existentes.
          </DialogDescription>
        </DialogHeader>
        <CreateBatchForm onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
