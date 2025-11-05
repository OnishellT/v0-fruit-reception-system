import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { UpdateCacaoBatchSchema } from '@/lib/schemas/cacao';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const supabase = await createServiceRoleClient();
  try {
    const { batchId } = await params;
    const { data: batch, error } = await supabase
      .from('cacao_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (error) throw error;

    if (!batch) {
      return NextResponse.json({ error: 'Cacao batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const supabase = await createServiceRoleClient();
  try {
    const body = await request.json();
    const { batchId } = await params;
    const validation = UpdateCacaoBatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const { total_sacos_70kg, remainder_kg } = validation.data;

    // Calculate total dried weight
    const totalDriedWeight = (total_sacos_70kg * 70) + remainder_kg;

    // Update batch with calculated total dried weight and mark as completed
    const updateData = {
      total_sacos_70kg,
      remainder_kg,
      total_dried_weight: totalDriedWeight,
      status: 'Completed',
    };

    const { data: batch, error } = await supabase
      .from('cacao_batches')
      .update(updateData)
      .eq('id', batchId)
      .select()
      .single();

    if (error) throw error;

    // Get batch receptions to calculate proportional distribution
    const { data: batchReceptions, error: receptionError } = await supabase
      .from('batch_receptions')
      .select('reception_id, percentage_of_total')
      .eq('batch_id', batchId);

    if (receptionError) throw receptionError;

    // Update each reception with its proportional dried weight
    for (const batchReception of batchReceptions) {
      const proportionalDriedWeight = (batchReception.percentage_of_total / 100) * totalDriedWeight;

      // Update batch_receptions table
      await supabase
        .from('batch_receptions')
        .update({ proportional_dried_weight: proportionalDriedWeight })
        .eq('batch_id', batchId)
        .eq('reception_id', batchReception.reception_id);

      // Update receptions table with final dried weight and batch reference
      await supabase
        .from('receptions')
        .update({
          total_peso_dried: proportionalDriedWeight,
          f_batch_id: batchId
        })
        .eq('id', batchReception.reception_id);
    }

    return NextResponse.json(batch, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
