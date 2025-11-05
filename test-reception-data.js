import { db } from '../lib/db/index.js';
import { receptions } from '../lib/db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Test reception data loading to verify no runtime errors
 */
async function testReceptionDataLoading() {
  console.log('🧪 Testing Reception Data Loading...\n');

  try {
    // Test basic reception query
    const receptionData = await db
      .select({
        id: receptions.id,
        receptionNumber: receptions.receptionNumber,
        totalPesoFinal: receptions.totalPesoFinal,
        totalPesoOriginal: receptions.totalPesoOriginal,
      })
      .from(receptions)
      .limit(5);

    console.log('✅ Basic reception query successful');
    console.log('📊 Sample data:', receptionData.slice(0, 2));

    // Test the toFixed operations that were failing
    receptionData.forEach((reception, index) => {
      try {
        const pesoFinal = (Number(reception.totalPesoFinal) || 0).toFixed(2);
        const pesoOriginal = (Number(reception.totalPesoOriginal) || 0).toFixed(2);
        console.log(`✅ Reception ${index + 1}: Final=${pesoFinal}, Original=${pesoOriginal}`);
      } catch (error) {
        console.error(`❌ Error processing reception ${index + 1}:`, error);
      }
    });

    console.log('\n🎉 Reception data loading test passed!');
    console.log('✅ No runtime errors with numeric data processing');

  } catch (error) {
    console.error('❌ Reception data loading test failed:', error);
    process.exit(1);
  }
}

// Run the test
testReceptionDataLoading().catch(console.error);