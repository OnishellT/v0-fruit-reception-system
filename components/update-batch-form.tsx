'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateCacaoBatchSchema } from '@/lib/schemas/cacao';
import { UpdateCacaoBatch, CacaoBatch } from '@/lib/types/cacao';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface UpdateBatchFormProps {
  batch: CacaoBatch;
  onSuccess?: () => void;
}

export function UpdateBatchForm({ batch, onSuccess }: UpdateBatchFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCacaoBatch>({
    resolver: zodResolver(UpdateCacaoBatchSchema),
    defaultValues: {
      total_sacos_70kg: batch.total_sacos_70kg || undefined,
      remainder_kg: batch.remainder_kg || undefined,
    },
  });

  const onSubmit = async (data: UpdateCacaoBatch) => {
    try {
      const response = await fetch(`/api/batches/${batch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update cacao batch');
      }

      toast.success('Cacao batch updated successfully');
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="total_sacos_70kg">Total de Sacos (70kg)</Label>
        <Input id="total_sacos_70kg" type="number" {...register('total_sacos_70kg', { valueAsNumber: true })} />
        {errors.total_sacos_70kg && <p className="text-red-500 text-sm">{errors.total_sacos_70kg.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="remainder_kg">Resto (kg)</Label>
        <Input id="remainder_kg" type="number" {...register('remainder_kg', { valueAsNumber: true })} />
        {errors.remainder_kg && <p className="text-red-500 text-sm">{errors.remainder_kg.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Actualizando...' : 'Actualizar Lote'}
      </Button>
    </form>
  );
}
