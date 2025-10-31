const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting Debug Test\n');

    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('http://localhost:3000/dashboard/reception/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n📋 Checking initial state...\n');

    // Check all comboboxes
    const comboboxes = await page.locator('[role="combobox"]').count();
    console.log(`Found ${comboboxes} comboboxes`);

    // Click first combobox (provider)
    console.log('\n🔄 Clicking first combobox...');
    const trigger = page.locator('[role="combobox"]').first();
    await trigger.click();
    await page.waitForTimeout(1500);

    // Check for options with different selectors
    console.log('\n🔍 Looking for options...\n');

    const option1 = await page.locator('[role="option"]').count();
    console.log(`[role="option"]: ${option1} found`);

    const option2 = await page.locator('[data-radix-select-item]').count();
    console.log(`[data-radix-select-item]: ${option2} found`);

    const option3 = await page.locator('[role="listbox"]').count();
    console.log(`[role="listbox"]: ${option3} found`);

    const option4 = await page.locator('[role="listbox"] [data-radix-select-item]').count();
    console.log(`[role="listbox"] [data-radix-select-item]: ${option4} found`);

    const option5 = await page.locator('[role="combobox"] + * [role="option"]').count();
    console.log(`[role="combobox"] + * [role="option"]: ${option5} found`);

    // Screenshot
    await page.screenshot({ path: 'debug-dropdown.png' });
    console.log('\n📸 Screenshot saved as debug-dropdown.png');

    // Get HTML structure
    console.log('\n📄 HTML Structure of dropdown:');
    const html = await page.locator('[role="combobox"]').first().evaluate(el => {
      let current = el;
      let result = '';
      for (let i = 0; i < 3; i++) {
        if (!current) break;
        result += `\nLevel ${i}: ${current.tagName} class="${current.className}" role="${current.getAttribute('role') || 'none'}"`;
        current = current.nextElementSibling;
      }
      return result;
    });
    console.log(html);

    console.log('\n✅ Debug complete. Check debug-dropdown.png');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
})();
