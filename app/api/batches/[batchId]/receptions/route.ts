import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const supabase = await createServiceRoleClient();
  try {
    const { batchId } = await params;

    // Get batch receptions with reception details
    const { data: batchReceptions, error } = await supabase
      .from('batch_receptions')
      .select(`
        reception_id,
        wet_weight_contribution,
        percentage_of_total,
        proportional_dried_weight,
        receptions!inner (
          reception_number,
          fruit_subtype
        )
      `)
      .eq('batch_id', batchId);

    if (error) throw error;

    // Transform the data to flatten the nested structure
    const transformedData = batchReceptions.map((br: any) => ({
      reception_id: br.reception_id,
      wet_weight_contribution: br.wet_weight_contribution,
      percentage_of_total: br.percentage_of_total,
      proportional_dried_weight: br.proportional_dried_weight,
      reception_number: br.receptions?.reception_number,
      fruit_subtype: br.receptions?.fruit_subtype,
    }));

    return NextResponse.json(transformedData, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}