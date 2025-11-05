import { NextRequest, NextResponse } from "next/server";
import { calculateReceptionPricing } from "@/lib/actions/pricing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If reception_id is provided, fetch and combine lab samples
    let qualityMetrics = body.quality_evaluation || [];

    if (body.reception_id) {
      // Import the combineQualityMetrics function
      const { combineQualityMetrics } = await import('@/lib/utils/pricing');
      const { createServiceRoleClient } = await import('@/lib/supabase/server');

      const supabase = await createServiceRoleClient();

      // Fetch lab samples
      const { data: labSamples, error } = await supabase
        .from('laboratory_samples')
        .select('moho_percentage, basura_percentage, violetas_percentage')
        .eq('reception_id', body.reception_id);

      if (!error && labSamples && labSamples.length > 0) {
        // Combine quality metrics
        const receptionQuality = {
          moho: qualityMetrics.find((q: any) => q.metric === 'Moho')?.value,
          humedad: qualityMetrics.find((q: any) => q.metric === 'Humedad')?.value,
          violetas: qualityMetrics.find((q: any) => q.metric === 'Violetas')?.value,
        };

        const combinedMetrics = combineQualityMetrics(
          receptionQuality,
          labSamples.map((sample: any) => ({
            moho_percentage: sample.moho_percentage ? Number(sample.moho_percentage) : null,
            basura_percentage: sample.basura_percentage ? Number(sample.basura_percentage) : null,
            violetas_percentage: sample.violetas_percentage ? Number(sample.violetas_percentage) : null,
          }))
        );

        // Convert back to the expected format
        qualityMetrics = combinedMetrics.map(item => ({
          metric: item.metric,
          value: item.value
        }));
      }
    }

    const result = await calculateReceptionPricing({
      ...body,
      quality_evaluation: qualityMetrics
    });

    if (!result.can_calculate) {
      return NextResponse.json(
        { can_calculate: false, errors: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      can_calculate: true,
      data: result.data
    });
  } catch (error) {
    console.error("Error in POST /api/pricing/calculate:", error);
    return NextResponse.json(
      { can_calculate: false, errors: ["Error interno del servidor"] },
      { status: 500 }
    );
  }
}
