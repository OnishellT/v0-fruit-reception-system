import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { UpdateLaboratorySampleSchema } from "@/lib/schemas/cacao";
import { getFruitTypeBySubtype } from "@/lib/supabase/cacao"; // Moved import
import { revalidatePath } from "next/cache";

// Helper function to calculate lab sample discounts using threshold-based logic
async function calculateLabSampleDiscounts(supabase: any, receptionId: string, labSample: any) {
  try {
    // Get reception data
    const { data: reception, error: receptionError } = await supabase
      .from("receptions")
      .select("total_peso_original, fruit_type_id")
      .eq("id", receptionId)
      .single();

    if (receptionError || !reception) {
      console.error("Error fetching reception:", receptionError);
      return;
    }

    // Get fruit type name from ID
    const { data: fruitTypeData, error: fruitTypeError } = await supabase
      .from('fruit_types')
      .select('type')
      .eq('id', reception.fruit_type_id)
      .single();

    if (fruitTypeError || !fruitTypeData) {
      console.error("Error fetching fruit type:", fruitTypeError);
      return;
    }

    const fruitType = fruitTypeData.type;
    const originalWeight = Number(reception.total_peso_original) || 0;
    let totalDiscount = 0;
    const discountBreakdown = [];

    // Get discount thresholds for this fruit type
    const { data: thresholds, error: thresholdsError } = await supabase
      .from('discount_thresholds')
      .select('quality_metric, limit_value')
      .eq('pricing_rule.fruit_type', fruitType)
      .eq('pricing_rule.quality_based_pricing_enabled', true);

    if (thresholdsError) {
      console.error("Error fetching thresholds:", thresholdsError);
      return;
    }

    if (!thresholds || thresholds.length === 0) {
      console.log("No discount thresholds configured for fruit type:", fruitType);
      return;
    }

    // Transform thresholds to expected format
    const transformedThresholds = thresholds.map(t => ({
      quality_metric: t.quality_metric,
      limit_value: Number(t.limit_value)
    }));

    // Check each quality metric against thresholds using new logic
    const qualityMetrics = [
      { name: 'Violetas', value: labSample.violetas_percentage, metricKey: 'Violetas' },
      { name: 'Moho', value: labSample.moho_percentage, metricKey: 'Moho' },
      { name: 'Basura', value: labSample.basura_percentage, metricKey: 'Basura' }
    ];

    for (const metric of qualityMetrics) {
      if (metric.value && Number(metric.value) > 0) {
        // Find applicable threshold
        const threshold = transformedThresholds.find(t => t.quality_metric === metric.metricKey);

        if (threshold) {
          const value = Number(metric.value);
          const limit = threshold.limit_value;

          // Calculate discount: if quality value > limit, discount = (quality_value - limit_value)%
          if (value > limit) {
            const excessQuality = value - limit;
            const discountPercentage = excessQuality; // Direct percentage discount
            const discountAmount = originalWeight * (discountPercentage / 100);

            totalDiscount += discountAmount;

            discountBreakdown.push({
              recepcion_id: receptionId,
              parametro: `${metric.name} (Muestra Lab)`,
              umbral: limit,
              valor: value,
              porcentaje_descuento: discountPercentage,
              peso_descuento: discountAmount,
              created_by: 'dd47adf2-2981-4b83-b312-fd55057d4b57' // Valid user ID
            });
          }
        }
      }
    }

    // Clear existing lab sample discounts
    await supabase
      .from("desglose_descuentos")
      .delete()
      .eq("recepcion_id", receptionId)
      .like("parametro", "%(Muestra Lab)%");

    // Insert new discount breakdown
    if (discountBreakdown.length > 0) {
      const { error: insertError } = await supabase
        .from("desglose_descuentos")
        .insert(discountBreakdown);

      if (insertError) {
        console.error("Error inserting discount breakdown:", insertError);
      }
    }

    // Update reception totals - calculate total of ALL discounts
    const labAdjustment = (labSample.dried_sample_kg || 0) - (labSample.sample_weight || 0);

    // Get all discount breakdown records for this reception
    const { data: allDiscounts, error: fetchError } = await supabase
      .from("desglose_descuentos")
      .select("peso_descuento")
      .eq("recepcion_id", receptionId);

    if (fetchError) {
      console.error("Error fetching all discounts:", fetchError);
    }

    const totalAllDiscounts = allDiscounts ?
      allDiscounts.reduce((sum, discount) => sum + Number(discount.peso_descuento || 0), 0) : totalDiscount;

    const newTotalFinal = originalWeight - totalAllDiscounts + labAdjustment;

    const { error: updateError } = await supabase
      .from("receptions")
      .update({
        total_peso_descuento: totalAllDiscounts,
        total_peso_final: newTotalFinal,
        lab_sample_wet_weight: labSample.sample_weight,
        lab_sample_dried_weight: labSample.dried_sample_kg,
        updated_at: new Date().toISOString()
      })
      .eq("id", receptionId);

    if (updateError) {
      console.error("Error updating reception totals:", updateError);
      throw updateError;
    }

  } catch (error) {
    console.error("Error in calculateLabSampleDiscounts:", error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sampleId: string }> },
) {
  const supabase = await createServiceRoleClient();
  try {
    const { sampleId } = await params;
    console.log("Retrieving sampleId:", sampleId);
    const { data: sample, error } = await supabase
      .from("laboratory_samples")
      .select("*")
      .eq("id", sampleId)
      .single();

    if (error) throw error;

    if (!sample) {
      return NextResponse.json(
        { error: "Laboratory sample not found" },
        { status: 404 },
      );
    }
    console.log("Retrieved sample in GET:", sample); // Added logging

    return NextResponse.json(sample, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sampleId: string }> },
) {
  const supabase = await createServiceRoleClient();
  try {
    const body = await request.json();
    const { sampleId } = await params;


    const validation = UpdateLaboratorySampleSchema.safeParse(body);

    if (!validation.success) {
      console.error("Validation failed:", validation.error.errors);
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    // CRITICAL FIX: Check if sample is already completed
    const { data: existingSample, error: fetchError } = await supabase
      .from("laboratory_samples")
      .select("status, sample_weight, reception_id")
      .eq("id", sampleId)
      .single();

    if (fetchError || !existingSample) {
      throw new Error("Laboratory sample not found");
    }

    // Prevent updating a sample that has already been completed
    if (existingSample.status === "Result Entered") {
      return NextResponse.json(
        {
          error:
            "Laboratory sample results have already been submitted and cannot be modified",
          details: "Samples can only be updated once with dried weight results",
        },
        { status: 409 }, // 409 Conflict
      );
    }

    // Update the sample with the dried weight and set status to completed
    const { data: sample, error } = await supabase
      .from("laboratory_samples")
      .update({
        ...validation.data,
        status: "Result Entered",
      })
      .eq("id", sampleId)
      .select()
      .single();

    if (error) throw error;



    // Manually calculate and apply lab sample quality discounts
    // since the trigger was disabled due to schema mismatch
    await calculateLabSampleDiscounts(supabase, existingSample.reception_id, sample);

    // Revalidate the reception details page to show updated lab sample data
    revalidatePath(`/dashboard/reception/${existingSample.reception_id}`);
    revalidatePath('/dashboard/reception');

    return NextResponse.json(sample, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/samples/[sampleId]:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
