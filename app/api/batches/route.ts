import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { CreateCacaoBatchSchema } from '@/lib/schemas/cacao';

export async function GET(request: Request) {
  const supabase = await createServiceRoleClient();
  try {
    const { data: batches, error } = await supabase.from('cacao_batches').select('*');
    if (error) throw error;
    return NextResponse.json(batches, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createServiceRoleClient();
  try {
    const body = await request.json();
    const validation = CreateCacaoBatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const { reception_ids, ...batchData } = validation.data;

    // Calculate expected completion date
    const startDate = new Date(batchData.start_date);
    const expectedCompletionDate = new Date(startDate);
    expectedCompletionDate.setDate(startDate.getDate() + batchData.duration);

    // Get reception details to calculate weights
    const { data: receptions, error: receptionError } = await supabase
      .from('receptions')
      .select('id, total_peso_original')
      .in('id', reception_ids);

    if (receptionError) throw receptionError;

    // Calculate total wet weight
    const totalWetWeight = receptions.reduce((sum, reception) => sum + (reception.total_peso_original || 0), 0);

    // Create batch with calculated values
    const batchWithCalculations = {
      ...batchData,
      total_wet_weight: totalWetWeight,
      expected_completion_date: expectedCompletionDate.toISOString(),
    };

    const { data: batch, error } = await supabase
      .from('cacao_batches')
      .insert(batchWithCalculations)
      .select()
      .single();

    if (error) throw error;

    // Create batch receptions with calculated weights and percentages
    if (reception_ids && reception_ids.length > 0) {
      const batchReceptions = receptions.map(reception => ({
        batch_id: batch.id,
        reception_id: reception.id,
        wet_weight_contribution: reception.total_peso_original || 0,
        percentage_of_total: totalWetWeight > 0 ? ((reception.total_peso_original || 0) / totalWetWeight) * 100 : 0,
        proportional_dried_weight: 0, // Will be calculated when batch is completed
      }));

      const { error: batchReceptionError } = await supabase.from('batch_receptions').insert(batchReceptions);
      if (batchReceptionError) throw batchReceptionError;

      // Update the f_batch_id on the receptions to mark them as assigned to a batch
      const { error: updateReceptionsError } = await supabase
        .from('receptions')
        .update({ f_batch_id: batch.id })
        .in('id', reception_ids);

      if (updateReceptionsError) throw updateReceptionsError;
    }

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
