const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function calculateLabSampleDiscounts(receptionId) {
  try {
    console.log("🧪 Calculating lab sample discounts for reception:", receptionId);

    // Get lab sample data
    const { data: labSample, error: labError } = await supabase
      .from("laboratory_samples")
      .select("*")
      .eq("reception_id", receptionId)
      .single();

    if (labError || !labSample) {
      console.error("❌ Error fetching lab sample:", labError);
      return;
    }

    console.log("📊 Lab sample data:", labSample);

    // Get reception data
    const { data: reception, error: receptionError } = await supabase
      .from("receptions")
      .select("total_peso_original, fruit_type_id")
      .eq("id", receptionId)
      .single();

    if (receptionError || !reception) {
      console.error("❌ Error fetching reception:", receptionError);
      return;
    }

    console.log("📦 Reception data:", reception);

    // Get fruit type name from ID
    const { data: fruitTypeData, error: fruitTypeError } = await supabase
      .from('fruit_types')
      .select('type')
      .eq('id', reception.fruit_type_id)
      .single();

    if (fruitTypeError || !fruitTypeData) {
      console.error("❌ Error fetching fruit type:", fruitTypeError);
      return;
    }

    const fruitType = fruitTypeData.type;
    console.log("🍎 Fruit type:", fruitType);

    // Get pricing rule for this fruit type
    const { data: pricingRule, error: pricingError } = await supabase
      .from('pricing_rules')
      .select('id')
      .eq('fruit_type', fruitType)
      .eq('quality_based_pricing_enabled', true)
      .single();

    if (pricingError || !pricingRule) {
      console.log("ℹ️ No pricing rule found for fruit type:", fruitType);
      return;
    }

    // Get discount thresholds for this pricing rule
    const { data: thresholds, error: thresholdsError } = await supabase
      .from('discount_thresholds')
      .select('quality_metric, limit_value')
      .eq('pricing_rule_id', pricingRule.id);

    if (thresholdsError) {
      console.error("❌ Error fetching thresholds:", thresholdsError);
      return;
    }

    if (!thresholds || thresholds.length === 0) {
      console.log("ℹ️ No discount thresholds configured for fruit type:", fruitType);
      return;
    }

    console.log("📋 Thresholds:", thresholds);

    const originalWeight = Number(reception.total_peso_original) || 0;
    let totalDiscount = 0;
    const discountBreakdown = [];

    console.log("⚖️ Original weight:", originalWeight);

    // Check each quality metric against thresholds using new logic
    const qualityMetrics = [
      { name: 'Violetas', value: labSample.violetas_percentage, metricKey: 'Violetas' },
      { name: 'Moho', value: labSample.moho_percentage, metricKey: 'Moho' },
      { name: 'Basura', value: labSample.basura_percentage, metricKey: 'Basura' }
    ];

    console.log("🔍 Quality metrics:", qualityMetrics);

    for (const metric of qualityMetrics) {
      if (metric.value && Number(metric.value) > 0) {
        // Find applicable threshold
        const threshold = thresholds.find(t => t.quality_metric === metric.metricKey);

        if (threshold) {
          const value = Number(metric.value);
          const limit = Number(threshold.limit_value);

          console.log(`📊 Checking ${metric.name}: value=${value}, threshold=${limit}`);

          // Calculate discount: if quality value > limit, discount = (quality_value - limit_value)%
          if (value > limit) {
            const excessQuality = value - limit;
            const discountPercentage = excessQuality; // Direct percentage discount
            const discountAmount = originalWeight * (discountPercentage / 100);

            totalDiscount += discountAmount;

            console.log(`💰 Adding discount for ${metric.name}: ${discountPercentage}% = ${discountAmount}kg`);

            discountBreakdown.push({
              recepcion_id: receptionId,
              parametro: `${metric.name} (Muestra Lab)`,
              umbral: limit,
              valor: value,
              porcentaje_descuento: discountPercentage,
              peso_descuento: discountAmount,
              created_by: '00000000-0000-0000-0000-000000000000' // System user
            });
          }
        }
      }
    }

    console.log("📋 Discount breakdown:", discountBreakdown);
    console.log("💵 Total discount:", totalDiscount);

    // Clear existing lab sample discounts
    console.log("🗑️ Clearing existing lab sample discounts");
    const { error: deleteError } = await supabase
      .from("desglose_descuentos")
      .delete()
      .eq("recepcion_id", receptionId)
      .like("parametro", "%(Muestra Lab)%");

    if (deleteError) {
      console.error("❌ Error deleting existing discounts:", deleteError);
    }

    // Insert new discount breakdown
    if (discountBreakdown.length > 0) {
      console.log("💾 Inserting new discount breakdown");
      const { error: insertError } = await supabase
        .from("desglose_descuentos")
        .insert(discountBreakdown);

      if (insertError) {
        console.error("❌ Error inserting discount breakdown:", insertError);
      } else {
        console.log("✅ Successfully inserted discount breakdown");
      }
    } else {
      console.log("ℹ️ No discounts to insert");
    }

    // Update reception totals
    const labAdjustment = (labSample.dried_sample_kg || 0) - (labSample.sample_weight || 0);
    const newTotalDescuento = totalDiscount;
    const newTotalFinal = originalWeight - totalDiscount + labAdjustment;

    console.log("🔄 Updating reception totals:", {
      total_peso_descuento: newTotalDescuento,
      total_peso_final: newTotalFinal,
      lab_adjustment: labAdjustment
    });

    const { error: updateError } = await supabase
      .from("receptions")
      .update({
        total_peso_descuento: newTotalDescuento,
        total_peso_final: newTotalFinal,
        updated_at: new Date().toISOString()
      })
      .eq("id", receptionId);

    if (updateError) {
      console.error("❌ Error updating reception totals:", updateError);
    } else {
      console.log("✅ Successfully updated reception totals");
    }

  } catch (error) {
    console.error("❌ Error in calculateLabSampleDiscounts:", error);
  }
}

// Run for the specific reception
calculateLabSampleDiscounts('e0f6858b-201f-45c4-8637-ee17652ee1c7');