const { createQualityEvaluation, updateQualityEvaluation, getQualityEvaluation } = require('../lib/actions/quality-universal');
const { createReception } = require('../lib/actions/reception');

async function testQualityDiscounts() {
  console.log('🧪 Testing Quality Discount Calculation');

  try {
    // First create a reception
    console.log('📝 Creating test reception...');
    const receptionData = {
      provider_id: 'test-provider',
      driver_id: 'test-driver',
      fruit_type_id: 'test-fruit-type',
      truck_plate: 'TEST-123',
      total_containers: 10,
      reception_date: new Date().toISOString(),
      details: [{
        fruit_type_id: 'test-fruit-type',
        quantity: 100,
        weight_kg: 1000
      }]
    };

    const receptionResult = await createReception(receptionData);
    if (!receptionResult.success) {
      console.error('❌ Failed to create reception:', receptionResult.error);
      return;
    }

    const receptionId = receptionResult.data.id;
    console.log('✅ Created reception:', receptionId);

    // Create quality evaluation with high values (should trigger discounts)
    console.log('🔬 Creating quality evaluation with high values...');
    const qualityData = {
      recepcion_id: receptionId,
      violetas: 20, // Above 15% threshold
      humedad: 25, // Above 15% threshold
      moho: 5     // Below threshold
    };

    const qualityResult = await createQualityEvaluation(qualityData);
    if (!qualityResult.success) {
      console.error('❌ Failed to create quality evaluation:', qualityResult.error);
      return;
    }

    console.log('✅ Created quality evaluation');

    // Check if discounts were applied
    console.log('💰 Checking discount calculation...');
    const discountResult = await getDiscountBreakdown(receptionId);
    if (discountResult.success && discountResult.data) {
      console.log('✅ Discount calculation successful');
      console.log('📊 Total discount:', discountResult.data.total_peso_descuento);
      console.log('📋 Breakdown:', discountResult.data.breakdown);
    } else {
      console.log('❌ No discounts found');
    }

    // Update quality evaluation
    console.log('🔄 Updating quality evaluation...');
    const updateData = {
      violetas: 30, // Even higher
      humedad: 15, // At threshold
      moho: 10    // Still below
    };

    const updateResult = await updateQualityEvaluation(receptionId, updateData);
    if (!updateResult.success) {
      console.error('❌ Failed to update quality evaluation:', updateResult.error);
      return;
    }

    console.log('✅ Updated quality evaluation');

    // Check updated discounts
    console.log('💰 Checking updated discount calculation...');
    const updatedDiscountResult = await getDiscountBreakdown(receptionId);
    if (updatedDiscountResult.success && updatedDiscountResult.data) {
      console.log('✅ Updated discount calculation successful');
      console.log('📊 Updated total discount:', updatedDiscountResult.data.total_peso_descuento);
      console.log('📋 Updated breakdown:', updatedDiscountResult.data.breakdown);
    } else {
      console.log('❌ No updated discounts found');
    }

    console.log('🎉 Quality discount test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Import the missing function
const { getDiscountBreakdown } = require('../lib/actions/pricing');

// Run the test
testQualityDiscounts();