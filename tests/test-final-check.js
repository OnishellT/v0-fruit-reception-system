const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 Final Check - Understanding the Issue\n');

    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('http://localhost:3000/dashboard/reception/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('1. Clicking combobox...\n');
    const combobox = page.locator('[role="combobox"]').first();
    await combobox.click();
    await page.waitForTimeout(1500);

    console.log('2. Checking for ALL possible selectors...\n');
    
    const selectors = [
      '[role="listbox"]',
      '[data-radix-select-content]',
      '[data-radix-popper-content-wrapper]',
      '[data-radix-select-item]',
      '[data-radix-collection-item]',
      'div[role="option"]',
      '[role="option"]',
      '[data-testid*="select"]',
      '[class*="select-content"]',
      '[class*="dropdown"]'
    ];

    for (let sel of selectors) {
      const elements = await page.$$(sel);
      if (elements.length > 0) {
        console.log(`✓ Found ${elements.length} with "${sel}"`);
        
        for (let i = 0; i < Math.min(2, elements.length); i++) {
          const isVisible = await elements[i].isVisible();
          const text = await elements[i].innerText();
          console.log(`  [${i}] Visible: ${isVisible}, Text: "${text.substring(0, 50)}..."`);
        }
      }
    }

    console.log('\n3. Taking screenshot...\n');
    await page.screenshot({ path: 'reception-form-test.png', fullPage: true });
    console.log('   Saved: reception-form-test.png\n');

    console.log('4. Manual test - clicking around...\n');
    
    // Try to click visible options
    const visibleOptions = page.locator('[role="option"]').filter({ hasNotText: '' });
    const count = await visibleOptions.count();
    console.log(`   Found ${count} visible options with role="option"`);
    
    if (count > 0) {
      console.log('   Attempting to click...');
      await visibleOptions.first().click();
      await page.waitForTimeout(1000);
      console.log('   ✅ Clicked successfully!');
      
      // Check if selection worked
      const selectValue = page.locator('[data-slot="select-value"]');
      const valueText = await selectValue.first().innerText();
      console.log(`   Selected value: "${valueText}"`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
