const { chromium } = require('playwright');

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
    log('🚀 Starting Reception Creation - Final Test\n');

    await test('Login', async () => {
      await page.goto('http://localhost:3001/login');
      await page.fill('#username', 'admin');
      await page.fill('#password', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    const receptionData = {
      truck_plate: `TRK-${timestamp}`,
      total_containers: '10',
      notes: `Test ${timestamp}`
    };

    log('\n=== CREATING RECEPTION ===', 'info');

    await test('Load form', async () => {
      // First navigate to dashboard to ensure we're authenticated
      await page.goto('http://localhost:3001/dashboard');
      await page.waitForTimeout(2000);

      // Then navigate to the new reception page
      await page.goto('http://localhost:3001/dashboard/reception/new');
      await page.waitForTimeout(3000);

      // Check for any error messages
      const pageText = await page.textContent('body');
      if (pageText.includes('Error') || pageText.includes('datos faltantes')) {
        log(`⚠️ Page shows error: ${pageText.substring(0, 200)}`, 'warning');
      }
    });

    await test('Fill truck plate', async () => {
      // Wait for the element to be visible
      await page.waitForSelector('#truck_plate', { timeout: 10000 });
      await page.fill('#truck_plate', receptionData.truck_plate);
    });

    await test('Fill containers', async () => {
      await page.fill('#total_containers', receptionData.total_containers);
    });

    await test('Fill notes', async () => {
      await page.fill('#notes', receptionData.notes);
    });

    // Provider
    await test('Select provider', async () => {
      const trigger = page.locator('[role="combobox"]').first();
      await trigger.click();
      await page.waitForTimeout(1000);
      const option = page.locator('[role="option"]').first();
      await option.click();
      await page.waitForTimeout(500);
    });

    // Driver
    await test('Select driver', async () => {
      const triggers = page.locator('[role="combobox"]');
      await triggers.nth(1).click();
      await page.waitForTimeout(1500); // Increased wait time
      const options = page.locator('[role="option"]');
      const count = await options.count();
      if (count > 1) {
        await options.nth(1).click();
      } else if (count > 0) {
        await options.first().click();
      }
      await page.waitForTimeout(500);
    });

    // Fruit type
    await test('Select fruit type', async () => {
      const triggers = page.locator('[role="combobox"]');
      await triggers.nth(2).click();
      await page.waitForTimeout(1500); // Increased wait time
      const options = page.locator('[role="option"]');
      const count = await options.count();
      if (count > 2) {
        await options.nth(2).click();
      } else if (count > 0) {
        await options.first().click();
      }
      await page.waitForTimeout(500);
    });

    // Add detail
    await test('Add detail row', async () => {
      // Click "Add Detail" button if it exists
      const addDetailBtn = page.locator('button', { hasText: /Agregar/i }).or(
        page.locator('button', { hasText: /Add/i })
      );

      if (await addDetailBtn.isVisible()) {
        await addDetailBtn.click();
        await page.waitForTimeout(500);
      }

      // Fill quantity
      const quantityInputs = page.locator('input[id*="quantity"], input[name*="quantity"]');
      if (await quantityInputs.count() > 0) {
        await quantityInputs.first().fill('10');
      }

      // Fill weight
      const weightInputs = page.locator('input[id*="weight"], input[name*="weight"]');
      if (await weightInputs.count() > 0) {
        await weightInputs.first().fill('5.5');
      }

      await page.waitForTimeout(500);
    });

    await test('Submit form', async () => {
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    });

    await test('Verify created', async () => {
      await page.goto('http://localhost:3001/dashboard/reception');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const text = await page.textContent('body');
      if (!text.includes(receptionData.truck_plate)) {
        throw new Error('Reception not found in list');
      }
    });

    log('\n=== SUMMARY ===', 'info');
    log(`Tests: ${passed + failed}`);
    log(`Passed: ${passed}`, 'success');
    
    if (failed === 0) {
      log('\n🎉 SUCCESS! Created reception:', receptionData.truck_plate, 'success');
      process.exit(0);
    } else {
      log('\n⚠️ Some tests failed', 'warning');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
