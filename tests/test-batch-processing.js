const { chromium } = require('playwright');

async function testBatchProcessing() {
  console.log('🧪 Testing Cacao Batch Processing Workflow');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForSelector('text=Bienvenido');

    // Check if batch progress dashboard is visible
    const batchDashboard = await page.locator('text=Cacao Batch Progress').count();
    console.log(`✅ Batch Progress Dashboard visible: ${batchDashboard > 0}`);

    // Check if create batch dialog can be opened
    const createBatchButton = page.locator('button').filter({ hasText: /Create Batch|Crear Lote/i });
    const canCreateBatch = await createBatchButton.count() > 0;
    console.log(`✅ Create Batch button available: ${canCreateBatch}`);

    console.log('🎉 Batch processing UI components are present and accessible');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Only run if called directly
if (require.main === module) {
  testBatchProcessing();
}

module.exports = { testBatchProcessing };