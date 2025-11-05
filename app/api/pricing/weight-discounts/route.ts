import { NextRequest, NextResponse } from "next/server";
import { calculateWeightDiscounts, validateWeightDiscountInputs } from "@/lib/utils/pricing";
import { calculateWeightDiscountsAction } from "@/lib/actions/pricing";
import {
  WeightDiscountRequestSchema,
  WeightDiscountResponse,
  DiscountCalculationError,
  DiscountErrorCodes
} from "@/lib/types/pricing";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const headersList = headers();

    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    let requestData;
    try {
      requestData = WeightDiscountRequestSchema.parse(body);
    } catch (validationError) {
      console.error("Validation error in weight discount request:", validationError);
      const error = validationError as ZodError;
      return NextResponse.json(
        {
          success: false,
          error: "Datos inválidos",
          details: error.errors?.map((e: any) => e.message) || []
        },
        { status: 400 }
      );
    }

    // First get the fruit type name from the ID
    const { data: fruitTypeData, error: fruitTypeError } = await supabase
      .from('fruit_types')
      .select('type')
      .eq('id', requestData.fruit_type_id)
      .single();

    if (fruitTypeError || !fruitTypeData) {
      return NextResponse.json(
        { success: false, error: "Tipo de fruta no encontrado" },
        { status: 404 }
      );
    }

    // Fetch discount thresholds for the fruit type
    const { data: thresholds, error: thresholdsError } = await supabase
      .from('discount_thresholds')
      .select(`
        id,
        quality_metric,
        limit_value,
        pricing_rule_id,
        created_at,
        updated_at,
        created_by,
        updated_by
      `)
      .eq('pricing_rule.fruit_type', fruitTypeData.type)
      .eq('pricing_rule.quality_based_pricing_enabled', true);

    if (thresholdsError) {
      console.error("Error fetching thresholds:", thresholdsError);
      return NextResponse.json(
        { success: false, error: "Error al obtener umbrales de descuento" },
        { status: 500 }
      );
    }

    if (!thresholds || thresholds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No hay umbrales de descuento configurados para este tipo de fruta"
        },
        { status: 404 }
      );
    }

    // Transform thresholds to expected format
    const transformedThresholds = thresholds.map(threshold => ({
      id: threshold.id,
      pricing_rule_id: threshold.pricing_rule_id,
      quality_metric: threshold.quality_metric,
      limit_value: Number(threshold.limit_value),
      created_at: threshold.created_at,
      updated_at: threshold.updated_at,
      created_by: threshold.created_by,
      updated_by: threshold.updated_by,
    }));

    // Validate calculation inputs
    const validation = validateWeightDiscountInputs(
      requestData.total_weight,
      requestData.quality_data,
      transformedThresholds
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos inválidos para cálculo",
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Calculate weight discounts
    const calculationResult = calculateWeightDiscounts(
      requestData.total_weight,
      requestData.quality_data,
      transformedThresholds
    );

    // Create response data structure
    const responseData = {
      reception_id: requestData.reception_id,
      total_peso_original: calculationResult.original_weight,
      total_peso_descuento: calculationResult.total_discount,
      total_peso_final: calculationResult.final_weight,
      breakdown: calculationResult.breakdowns.map(breakdown => ({
        parametro: breakdown.parametro,
        umbral: breakdown.umbral,
        valor: breakdown.valor,
        porcentaje_descuento: breakdown.porcentaje_descuento,
        peso_descuento: breakdown.peso_descuento
      })),
      calculation_timestamp: new Date().toISOString(),
      calculated_by: user.id
    };

    // Log calculation for audit trail
    await supabase.from('weight_discount_calculations').insert({
      reception_id: requestData.reception_id,
      calculation_data: responseData,
      created_by: user.id
    });

    const response: WeightDiscountResponse = {
      success: true,
      data: responseData
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error in POST /api/pricing/weight-discounts:", error);

    // Handle specific error types
    if (error instanceof DiscountCalculationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const receptionId = searchParams.get('receptionId');

    if (!receptionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere el ID de recepción"
        },
        { status: 400 }
      );
    }

    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Fetch discount breakdown for the reception
    const { data: breakdown, error: breakdownError } = await supabase
      .from('desglose_descuentos')
      .select(`
        parametro,
        umbral,
        valor,
        porcentaje_descuento,
        peso_descuento,
        created_at
      `)
      .eq('recepcion_id', receptionId)
      .order('parametro');

    if (breakdownError) {
      console.error("Error fetching discount breakdown:", breakdownError);
      return NextResponse.json(
        {
          success: false,
          error: "Error al obtener desglose de descuentos"
        },
        { status: 500 }
      );
    }

    // Fetch reception weight fields
    const { data: reception, error: receptionError } = await supabase
      .from('receptions')
      .select('total_peso_original, total_peso_descuento, total_peso_final')
      .eq('id', receptionId)
      .single();

    if (receptionError) {
      console.error("Error fetching reception data:", receptionError);
      return NextResponse.json(
        {
          success: false,
          error: "Error al obtener datos de recepción"
        },
        { status: 500 }
      );
    }

    const responseData = {
      reception_id: receptionId,
      total_peso_original: reception.total_peso_original,
      total_peso_descuento: reception.total_peso_descuento,
      total_peso_final: reception.total_peso_final,
      breakdown: breakdown || [],
      calculation_timestamp: breakdown?.[0]?.created_at || null,
      calculated_by: user.id
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("Error in GET /api/pricing/weight-discounts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor"
      },
      { status: 500 }
    );
  }
}