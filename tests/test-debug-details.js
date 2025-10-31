const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting Debug Test for Details\n');

    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('http://localhost:3000/dashboard/reception/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Fill basic info
    await page.fill('#truck_plate', 'TRK-DEBUG');
    await page.fill('#total_containers', '10');
    await page.fill('#notes', 'Debug test');

    // Select all three dropdowns
    console.log('\n📋 Selecting dropdowns...\n');
    const comboboxes = page.locator('[role="combobox"]');
    const count = await comboboxes.count();
    console.log(`Found ${count} comboboxes`);

    // Provider
    console.log('Selecting provider...');
    await comboboxes.first().click();
    await page.waitForTimeout(1500);
    let options = page.locator('[role="option"]');
    let optionCount = await options.count();
    console.log(`Found ${optionCount} options`);
    await options.first().click();
    await page.waitForTimeout(500);

    // Driver
    console.log('Selecting driver...');
    await comboboxes.nth(1).click();
    await page.waitForTimeout(1500);
    options = page.locator('[role="option"]');
    optionCount = await options.count();
    console.log(`Found ${optionCount} options`);
    await options.first().click();
    await page.waitForTimeout(500);

    // Fruit type
    console.log('Selecting fruit type...');
    await comboboxes.nth(2).click();
    await page.waitForTimeout(1500);
    options = page.locator('[role="option"]');
    optionCount = await options.count();
    console.log(`Found ${optionCount} options`);
    await options.first().click();
    await page.waitForTimeout(1000);

    console.log('\n🔍 Looking for detail fields...\n');

    // Check for various selectors
    const selectors = [
      '#quantity',
      '#weight_kg',
      'input[type="number"]',
      'input[placeholder*="cantidad"]',
      'input[placeholder*="Cantidad"]',
      'input[placeholder*="peso"]',
      'input[placeholder*="Peso"]'
    ];

    for (const sel of selectors) {
      const count = await page.locator(sel).count();
      console.log(`${sel}: ${count} found`);
    }

    // Check for button
    const buttonText = await page.locator('button:has-text("Agregar Detalle")').count();
    console.log(`\nbutton:has-text("Agregar Detalle"): ${buttonText} found`);

    // Screenshot
    await page.screenshot({ path: 'debug-details.png' });
    console.log('\n📸 Screenshot saved as debug-details.png');

    // Get HTML of detail section
    console.log('\n📄 HTML of first input[type="number"]:');
    try {
      const html = await page.locator('input[type="number"]').first().evaluate(el => {
        return `id="${el.id}" placeholder="${el.placeholder}" name="${el.name}" class="${el.className}"`;
      });
      console.log(html);
    } catch (e) {
      console.log('Error getting HTML:', e.message);
    }

    console.log('\n✅ Debug complete. Check debug-details.png');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
})();
