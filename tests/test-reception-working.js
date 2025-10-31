const { chromium } = require('playwright');

/**
 * Reception Creation Test - Final Working Version
 * Correctly interacts with Radix UI selects
 */

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;
  const timestamp = Date.now();

  const log = (message, status = 'info') => {
    const symbols = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    };
    console.log(`${symbols[status]} ${message}`);
  };

  const test = async (name, fn) => {
    try {
      log(`Starting test: ${name}`, 'test');
      await fn();
      passed++;
      log(`Test passed: ${name}`, 'success');
    } catch (error) {
      failed++;
      log(`Test failed: ${name} - ${error.message}`, 'error');
      throw error;
    }
  };

  try {
    log('🚀 Starting Reception Creation Test (Final)\n');

    await test('Should login successfully', async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('#username', 'admin');
      await page.fill('#password', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    const receptionData = {
      truck_plate: `TRK-${timestamp}`,
      total_containers: '10',
      notes: `Test Reception ${timestamp}`
    };

    log('\n=== CREATING RECEPTION ===', 'info');

    await test('Should load reception form', async () => {
      await page.goto('http://localhost:3000/dashboard/reception/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    await test('Should fill truck plate', async () => {
      await page.fill('#truck_plate', receptionData.truck_plate);
    });

    await test('Should fill total containers', async () => {
      await page.fill('#total_containers', receptionData.total_containers);
    });

    await test('Should fill notes', async () => {
      await page.fill('#notes', receptionData.notes);
    });

    // Select provider
    await test('Should select provider', async () => {
      const trigger = page.locator('[role="combobox"]').first();
      await trigger.click();
      await page.waitForTimeout(1000);
      const item = page.locator('[role="listbox"] [data-radix-select-item]').first();
      await item.click();
      await page.waitForTimeout(500);
    });

    // Select driver
    await test('Should select driver', async () => {
      const triggers = page.locator('[role="combobox"]');
      await triggers.nth(1).click();
      await page.waitForTimeout(1000);
      const items = page.locator('[role="listbox"] [data-radix-select-item]');
      await items.nth(1).click();
      await page.waitForTimeout(500);
    });

    // Select fruit type
    await test('Should select fruit type', async () => {
      const triggers = page.locator('[role="combobox"]');
      await triggers.nth(2).click();
      await page.waitForTimeout(1000);
      const items = page.locator('[role="listbox"] [data-radix-select-item]');
      await items.nth(2).click();
      await page.waitForTimeout(500);
    });

    await test('Should submit reception form', async () => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(3000);
    });

    await test('Should verify reception created', async () => {
      await page.goto('http://localhost:3000/dashboard/reception');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const pageText = await page.textContent('body');
      if (!pageText.includes(receptionData.truck_plate)) {
        throw new Error(`Reception ${receptionData.truck_plate} not found`);
      }
    });

    log('\n=== TEST SUMMARY ===', 'info');
    log(`Total tests: ${passed + failed}`);
    log(`Passed: ${passed}`, 'success');
    log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success');

    if (failed === 0) {
      log('\n🎉 All tests passed!', 'success');
      log(`✅ Created reception: ${receptionData.truck_plate}`, 'success');
      process.exit(0);
    } else {
      log('\n⚠️ Some tests failed', 'warning');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
