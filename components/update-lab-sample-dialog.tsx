"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UpdateLabSampleForm } from "./update-lab-sample-form";
import { LaboratorySample } from "@/lib/types/cacao";

interface UpdateLabSampleDialogProps {
  sample: LaboratorySample;
  onSuccess?: () => void;
}

export function UpdateLabSampleDialog({
  sample,
  onSuccess,
}: UpdateLabSampleDialogProps) {
  const isCompleted = sample.status === "Result Entered";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={isCompleted ? "secondary" : "outline"}>
          {isCompleted ? "Ver Resultados" : "Completar Muestra"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isCompleted
              ? "Resultados de Muestra de Laboratorio"
              : "Completar Muestra de Laboratorio"}
          </DialogTitle>
          <DialogDescription>
            {isCompleted
              ? "Esta muestra ha sido completada. Los resultados no pueden ser modificados."
              : "Ingrese el peso seco y los resultados de calidad para esta muestra de laboratorio. Una vez enviado, esto no se puede deshacer."}
          </DialogDescription>
        </DialogHeader>
        <UpdateLabSampleForm sample={sample} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
