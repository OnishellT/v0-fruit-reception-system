'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCacaoBatchSchema } from '@/lib/schemas/cacao';
import { CreateCacaoBatch } from '@/lib/types/cacao';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateBatchFormProps {
  onSuccess?: () => void;
}

interface Reception {
  id: string;
  reception_number: string;
  total_weight: number;
  fruit_type: string;
  fruit_subtype: string;
}

export function CreateBatchForm({ onSuccess }: CreateBatchFormProps) {
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [selectedReceptions, setSelectedReceptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCacaoBatch>({
    resolver: zodResolver(CreateCacaoBatchSchema),
  });

  // Load available receptions
  useEffect(() => {
    const loadReceptions = async () => {
      try {
        const response = await fetch('/api/receptions?status=pending&limit=50');
        if (response.ok) {
          const data = await response.json();
          // Filter for cacao receptions that aren't already in a batch
          const cacaoReceptions = data.filter((r: any) =>
            r.fruit_type === 'CACAO' &&
            !r.f_batch_id &&
            r.total_peso_original > 0
          );
          setReceptions(cacaoReceptions);
        }
      } catch (error) {
        console.error('Failed to load receptions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReceptions();
  }, []);

  const handleReceptionToggle = (receptionId: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedReceptions, receptionId]
      : selectedReceptions.filter(id => id !== receptionId);

    setSelectedReceptions(newSelected);
    setValue('reception_ids', newSelected);
  };

  const onSubmit = async (data: CreateCacaoBatch) => {
    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create cacao batch');
      }

      toast.success('Cacao batch created successfully');
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="batch_type">Tipo de Lote</Label>
        <select
          id="batch_type"
          {...register('batch_type')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Seleccionar tipo de lote</option>
          <option value="Drying">Secado</option>
          <option value="Fermentation">Fermentación</option>
          <option value="Fermentation + Drying">Fermentación + Secado</option>
        </select>
        {errors.batch_type && <p className="text-red-500 text-sm">{errors.batch_type.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="start_date">Fecha de Inicio</Label>
        <Input id="start_date" type="datetime-local" {...register('start_date')} />
        {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="duration">Duración (días)</Label>
        <Input id="duration" type="number" {...register('duration', { valueAsNumber: true })} />
        {errors.duration && <p className="text-red-500 text-sm">{errors.duration.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label>Seleccionar Recepciones</Label>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando recepciones...</p>
        ) : receptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No se encontraron recepciones de cacao disponibles.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
            {receptions.map((reception) => (
              <div key={reception.id} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id={`reception-${reception.id}`}
                  checked={selectedReceptions.includes(reception.id)}
                  onChange={(e) => handleReceptionToggle(reception.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor={`reception-${reception.id}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {reception.reception_number} - {reception.fruit_subtype} ({reception.total_weight}kg)
                </label>
              </div>
            ))}
          </div>
        )}
        {selectedReceptions.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedReceptions.length} recepción(es) seleccionada(s)
          </p>
        )}
        {errors.reception_ids && <p className="text-red-500 text-sm">{errors.reception_ids.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting || selectedReceptions.length === 0}>
        {isSubmitting ? 'Creando...' : 'Crear Lote'}
      </Button>
    </form>
  );
}
