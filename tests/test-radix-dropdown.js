const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 Testing Radix UI Dropdown Interaction\n');

    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('http://localhost:3000/dashboard/reception/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('1. Finding combobox...\n');
    const combobox = page.locator('[role="combobox"]').first();
    await combobox.click();
    await page.waitForTimeout(1000);

    console.log('2. After clicking combobox, checking for dropdown...\n');

    // Check for dropdown content
    const dropdowns = await page.$$('[role="listbox"], [data-radix-select-content], [data-radix-popper-content-wrapper]');
    console.log(`   Found ${dropdowns.length} dropdown-like elements`);

    // Check for visible options
    const allDivs = await page.$$('div');
    console.log(`   Total divs on page: ${allDivs.length}`);

    // Get page screenshot
    await page.screenshot({ path: 'dropdown-open.png' });
    console.log('\n3. Screenshot saved as dropdown-open.png');
    console.log('   Please check the image to see what happened\n');

    console.log('4. Checking visible elements:\n');

    // Try different patterns
    const patterns = [
      '[data-radix-select-content]',
      '[role="listbox"]',
      '[data-radix-select-item]',
      '[data-radix-collection-item]'
    ];

    for (let pattern of patterns) {
      const elements = await page.$$(pattern);
      if (elements.length > 0) {
        console.log(`   Found ${elements.length} elements with "${pattern}"`);

        // Try to click one
        try {
          await elements[0].click();
          console.log(`   ✅ Clicked element with "${pattern}"`);
          await page.waitForTimeout(500);
        } catch (e) {
          console.log(`   ❌ Failed to click: ${e.message}`);
        }
      }
    }

    console.log('\n5. Checking SelectContent...\n');
    const selectContent = page.locator('[data-radix-select-content]');
    const isVisible = await selectContent.isVisible();
    console.log(`   SelectContent visible: ${isVisible}`);

    if (isVisible) {
      const items = selectContent.locator('[data-radix-select-item]');
      const count = await items.count();
      console.log(`   Found ${count} select items`);

      if (count > 0) {
        console.log('   Clicking first item...');
        await items.first().click();
        await page.waitForTimeout(500);
        console.log('   ✅ Clicked first item');
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
