const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 Checking Select Structure\n');

    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('http://localhost:3000/dashboard/reception/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('1. Checking for select-like elements:\n');

    // Check for various selector patterns
    const patterns = [
      'select',
      '[role="combobox"]',
      '[data-radix-collection-item]',
      '[data-radix-select-trigger]',
      'button:has-text("Seleccione")',
      'button:has-text("Seleccione un")',
      '[id*="provider"]',
      '[id*="driver"]',
      '[id*="fruit"]'
    ];

    for (let pattern of patterns) {
      const elements = await page.$$(pattern);
      if (elements.length > 0) {
        console.log(`   Found ${elements.length} elements with "${pattern}"`);
        
        // Get first few elements' HTML
        for (let i = 0; i < Math.min(2, elements.length); i++) {
          const html = await elements[i].innerHTML();
          console.log(`   Element ${i + 1}:`, html.substring(0, 150));
        }
      }
    }

    console.log('\n2. Checking page structure:\n');
    const bodyText = await page.textContent('body');
    if (bodyText.includes('Proveedores cargados')) {
      console.log('   ✅ Providers loaded');
    }
    if (bodyText.includes('Choferes cargados')) {
      console.log('   ✅ Drivers loaded');
    }
    if (bodyText.includes('Tipos de fruto cargados')) {
      console.log('   ✅ Fruit types loaded');
    }

    console.log('\n3. All interactive elements:\n');
    const buttons = await page.$$('button');
    const inputs = await page.$$('input');
    const textareas = await page.$$('textarea');
    console.log(`   Buttons: ${buttons.length}`);
    console.log(`   Inputs: ${inputs.length}`);
    console.log(`   Textareas: ${textareas.length}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
