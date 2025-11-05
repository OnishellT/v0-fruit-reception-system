const { db } = require('./lib/db/index');
const { qualityEvaluations, receptions, desgloseDescuentos } = require('./lib/db/schema');
const { eq, sql } = require('drizzle-orm');

async function testQualityDiscountCalculation() {
  console.log('🧪 Testing Quality Discount Calculation Logic');

  try {
    // Get a test reception
    const testReceptions = await db
      .select({
        id: receptions.id,
        totalPesoOriginal: receptions.totalPesoOriginal
      })
      .from(receptions)
      .limit(1);

    if (testReceptions.length === 0) {
      console.log('❌ No test receptions found. Please create a reception first.');
      return;
    }

    const receptionId = testReceptions[0].id;
    const originalWeight = Number(testReceptions[0].totalPesoOriginal) || 0;

    console.log(`📊 Testing with reception ${receptionId}, original weight: ${originalWeight}kg`);

    // Create a quality evaluation with high values
    const qualityRecord = await db
      .insert(qualityEvaluations)
      .values({
        recepcionId: receptionId,
        violetas: '20', // Above 15% threshold
        humedad: '25', // Above 15% threshold
        moho: '5',    // Below threshold
        createdBy: 'test-user',
        updatedBy: 'test-user'
      })
      .returning();

    console.log('✅ Created quality evaluation');

    // Test the discount calculation logic
    let totalDiscount = 0;
    const discountBreakdown = [];

    const qualityMetrics = [
      { name: 'Violetas', value: 20 },
      { name: 'Humedad', value: 25 },
      { name: 'Moho', value: 5 }
    ];

    for (const metric of qualityMetrics) {
      if (metric.value > 15) { // If exceeds 15% threshold
        const discountAmount = originalWeight * 0.10; // 10% discount
        totalDiscount += discountAmount;

        discountBreakdown.push({
          recepcionId: receptionId,
          parametro: `${metric.name} (Evaluación)`,
          umbral: 15,
          valor: metric.value,
          porcentajeDescuento: 10,
          pesoDescuento: discountAmount,
          createdBy: 'test-user'
        });
      }
    }

    console.log(`💰 Calculated discounts: ${totalDiscount}kg total`);
    console.log('📋 Breakdown:', discountBreakdown.map(d => `${d.parametro}: -${d.pesoDescuento}kg`));

    // Insert discount breakdown
    if (discountBreakdown.length > 0) {
      await db.insert(desgloseDescuentos).values(
        discountBreakdown.map(item => ({
          recepcionId: item.recepcionId,
          parametro: item.parametro,
          umbral: item.umbral.toString(),
          valor: item.valor.toString(),
          porcentajeDescuento: item.porcentajeDescuento.toString(),
          pesoDescuento: item.pesoDescuento.toString(),
          createdBy: item.createdBy
        }))
      );
      console.log('✅ Inserted discount breakdown');
    }

    // Update reception totals
    const labAdjustment = 0; // Simplified for test
    const newTotalDescuento = totalDiscount;
    const newTotalFinal = originalWeight - newTotalDescuento + labAdjustment;

    await db
      .update(receptions)
      .set({
        totalPesoDescuento: newTotalDescuento,
        totalPesoFinal: newTotalFinal,
        updatedAt: new Date(),
      })
      .where(eq(receptions.id, receptionId));

    console.log(`📊 Updated reception totals: descuento=${newTotalDescuento}, final=${newTotalFinal}`);

    // Verify the discounts were stored
    const storedDiscounts = await db
      .select()
      .from(desgloseDescuentos)
      .where(sql`${desgloseDescuentos.recepcionId} = ${receptionId} AND ${desgloseDescuentos.parametro} LIKE '%(Evaluación)%'`);

    console.log(`✅ Found ${storedDiscounts.length} stored discounts`);
    storedDiscounts.forEach(discount => {
      console.log(`   - ${discount.parametro}: ${discount.pesoDescuento}kg`);
    });

    // Clean up test data
    await db
      .delete(desgloseDescuentos)
      .where(sql`${desgloseDescuentos.recepcionId} = ${receptionId} AND ${desgloseDescuentos.parametro} LIKE '%(Evaluación)%'`);

    await db
      .delete(qualityEvaluations)
      .where(eq(qualityEvaluations.recepcionId, receptionId));

    console.log('🧹 Cleaned up test data');

    console.log('🎉 Quality discount calculation test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testQualityDiscountCalculation();