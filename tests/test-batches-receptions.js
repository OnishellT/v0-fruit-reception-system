const { chromium } = require('playwright');

async function testBatchesReceptions() {
  console.log('🧪 Testing Batches Page - Available Receptions');

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

    // Click on the batches link
    await page.locator('a').filter({ hasText: 'Procesamiento de Cacao' }).click();

    // Wait for the batches page to load
    await page.waitForSelector('text=Procesamiento de Cacao');

    // Check if we're on the available receptions tab (should be default)
    const availableTab = await page.locator('button').filter({ hasText: /Recepciones Disponibles/ }).count();
    console.log(`✅ Available receptions tab visible: ${availableTab > 0}`);

    // Wait a moment for data to load
    await page.waitForTimeout(2000);

    // Check if any receptions are displayed
    const receptionRows = await page.locator('table tbody tr').count();
    console.log(`📊 Number of reception rows found: ${receptionRows}`);

    if (receptionRows > 0) {
      console.log('✅ Receptions are visible in the batches page!');
    } else {
      // Check if the "no receptions" message is shown
      const noReceptionsMessage = await page.locator('text=No hay recepciones de cacao disponibles').count();
      if (noReceptionsMessage > 0) {
        console.log('⚠️ No receptions available message shown');
      } else {
        console.log('❌ Neither receptions nor "no receptions" message found');
      }
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'batches-page-debug.png' });
    console.log('📸 Screenshot saved as batches-page-debug.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Only run if called directly
if (require.main === module) {
  testBatchesReceptions();
}

module.exports = { testBatchesReceptions };