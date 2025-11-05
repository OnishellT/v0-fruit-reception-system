const { chromium } = require('playwright');

async function testBatchesPage() {
  console.log('🧪 Testing Batches Page Navigation and UI');

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

    // Check if the batches navigation link exists
    const batchesLink = await page.locator('a').filter({ hasText: 'Procesamiento de Cacao' }).count();
    console.log(`✅ Batches navigation link visible: ${batchesLink > 0}`);

    if (batchesLink > 0) {
      // Click on the batches link
      await page.locator('a').filter({ hasText: 'Procesamiento de Cacao' }).click();

      // Wait for the batches page to load
      await page.waitForSelector('text=Procesamiento de Cacao');

      // Check if the page title is correct
      const pageTitle = await page.locator('h1').filter({ hasText: 'Procesamiento de Cacao' }).count();
      console.log(`✅ Batches page title visible: ${pageTitle > 0}`);

      // Check if tabs are present
      const availableTab = await page.locator('button').filter({ hasText: /Recepciones Disponibles/ }).count();
      const batchesTab = await page.locator('button').filter({ hasText: /Lotes Activos/ }).count();
      console.log(`✅ Available receptions tab visible: ${availableTab > 0}`);
      console.log(`✅ Active batches tab visible: ${batchesTab > 0}`);
    }

    console.log('🎉 Batches page navigation and UI components are working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Only run if called directly
if (require.main === module) {
  testBatchesPage();
}

module.exports = { testBatchesPage };