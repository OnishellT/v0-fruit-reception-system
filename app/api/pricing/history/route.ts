import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();

    const { data, error } = await supabase
      .from("receptions")
      .select(`
        id,
        reception_number,
        reception_date,
        provider:providers!inner(name),
        fruit_type:fruit_types!inner(type),
        pricing_calculations(
          id,
          base_price_per_kg,
          total_weight,
          gross_value,
          total_discount_amount,
          final_total,
          created_at,
          calculation_data
        )
      `)
      .not("pricing_calculations", "is", null)
      .order("reception_date", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching pricing history:", error);
      return NextResponse.json(
        { success: false, error: "Error al obtener el historial de precios" },
        { status: 500 }
      );
    }

    // Filter out receptions without pricing calculations
    const receptionsWithPricing = (data || []).filter(
      (r) => r.pricing_calculations && r.pricing_calculations.length > 0
    );

    return NextResponse.json({
      success: true,
      data: receptionsWithPricing
    });
  } catch (error) {
    console.error("Error in GET /api/pricing/history:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
