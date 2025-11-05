'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateLaboratorySampleSchema } from '@/lib/schemas/cacao';
import { CreateLaboratorySample } from '@/lib/types/cacao';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateLabSampleFormProps {
  receptionId: string;
  onSuccess?: () => void;
}

export function CreateLabSampleForm({ receptionId, onSuccess }: CreateLabSampleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateLaboratorySample>({
    resolver: zodResolver(CreateLaboratorySampleSchema),
  });

  const onSubmit = async (data: CreateLaboratorySample) => {
    try {
      const response = await fetch(`/api/receptions/${receptionId}/samples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create laboratory sample');
      }

      toast.success('Muestra de laboratorio creada exitosamente');
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="sample_weight">Peso de Muestra (kg)</Label>
        <Input id="sample_weight" type="number" {...register('sample_weight', { valueAsNumber: true })} />
        {errors.sample_weight && <p className="text-red-500 text-sm">{errors.sample_weight.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="estimated_drying_days">Días Estimados de Secado</Label>
        <Input id="estimated_drying_days" type="number" {...register('estimated_drying_days', { valueAsNumber: true })} />
        {errors.estimated_drying_days && <p className="text-red-500 text-sm">{errors.estimated_drying_days.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando...' : 'Crear Muestra'}
      </Button>
    </form>
  );
}
