import { NextRequest, NextResponse } from "next/server";
import { getPricingRules, updatePricingRules } from "@/lib/actions/pricing";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fruitType = searchParams.get("fruitType");

    if (fruitType) {
      const result = await getPricingRules(fruitType);
      return NextResponse.json(result);
    }

    // Get all pricing rules
    const { createServiceRoleClient } = await import("@/lib/supabase/server");
    const supabase = await createServiceRoleClient();

    const { data, error } = await supabase
      .from("pricing_rules")
      .select("*")
      .order("fruit_type", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: "Error al obtener las reglas de precios" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in GET /api/pricing/rules:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await updatePricingRules(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PATCH /api/pricing/rules:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
