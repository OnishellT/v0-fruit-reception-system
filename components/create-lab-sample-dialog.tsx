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
import { CreateLabSampleForm } from './create-lab-sample-form';

interface CreateLabSampleDialogProps {
  receptionId: string;
  onSuccess?: () => void;
  disabled?: boolean; // Added disabled prop
}

export function CreateLabSampleDialog({ receptionId, onSuccess, disabled }: CreateLabSampleDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={disabled}>Crear Muestra de Lab</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Muestra de Laboratorio</DialogTitle>
          <DialogDescription>
            Crear una nueva muestra de laboratorio para esta recepción.
          </DialogDescription>
        </DialogHeader>
        <CreateLabSampleForm receptionId={receptionId} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
