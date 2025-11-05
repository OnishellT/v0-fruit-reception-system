import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServiceRoleClient();
  const { searchParams } = new URL(request.url);

  try {
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('receptions')
      .select(`
        id,
        reception_number,
        total_peso_original,
        f_batch_id,
        fruit_type_id,
        fruit_types (
          type,
          subtype
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: receptions, error } = await query;

    if (error) throw error;

    // Transform the data to flatten the fruit_types relation
    const transformedReceptions = receptions.map((reception: any) => ({
      id: reception.id,
      reception_number: reception.reception_number,
      total_peso_original: reception.total_peso_original,
      f_batch_id: reception.f_batch_id,
      fruit_type: reception.fruit_types?.type,
      fruit_subtype: reception.fruit_types?.subtype,
    }));

    return NextResponse.json(transformedReceptions, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}