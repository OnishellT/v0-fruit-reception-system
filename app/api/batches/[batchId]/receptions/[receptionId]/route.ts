import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/actions/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ batchId: string; receptionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batchId, receptionId } = await params;
    const body = await request.json();
    const { proportional_dried_weight } = body;

    if (typeof proportional_dried_weight !== 'number' || proportional_dried_weight < 0) {
      return NextResponse.json(
        { error: 'Invalid proportional dried weight' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    // Update the batch_receptions table
    const { data, error } = await supabase
      .from('batch_receptions')
      .update({ proportional_dried_weight })
      .eq('batch_id', batchId)
      .eq('reception_id', receptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating batch reception:', error);
      return NextResponse.json(
        { error: 'Failed to update proportional dried weight' },
        { status: 500 }
      );
    }

    // Also update the reception table with the dried weight
    await supabase
      .from('receptions')
      .update({ total_peso_dried: proportional_dried_weight })
      .eq('id', receptionId);

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: session.id,
      action: 'update',
      table_name: 'batch_receptions',
      record_id: `${batchId}-${receptionId}`,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error in batch reception update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}