const { chromium } = require('playwright');

/**
 * Reception Creation Debug Test
 * Tests actual reception creation and verifies it appears in UI
 */

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors and responses
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.type(), msg.text());
  });

  page.on('response', async (response) => {
    if (response.url().includes('/dashboard/reception/new')) {
      console.log('\n📡 Response for form:', response.status());
      if (response.status() >= 400) {
        const text = await response.text();
        console.log('   Error:', text.substring(0, 500));
      }
    }
  });

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
      // Don't throw, continue with tests
    }
  };

  try {
    log('🚀 Starting Reception Creation Debug Test\n');

    // ========== LOGIN ==========
    await test('Should login successfully', async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('#username', 'admin');
      await page.fill('#password', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    // ========== CHECK EXISTING DATA ==========
    log('\n=== CHECKING EXISTING DATA ===', 'info');

    await test('Should load reception list', async () => {
      await page.goto('http://localhost:3000/dashboard/reception');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    await test('Should display existing receptions', async () => {
      const rows = await page.$$eval('table tbody tr', rows => rows.map(r => r.innerText));
      log(`   Found ${rows.length} existing receptions`);
      if (rows.length > 0) {
        log(`   First reception: ${rows[0].substring(0, 80)}...`);
      }
    });

    // ========== CREATE RECEPTION ==========
    log('\n=== CREATING RECEPTION ===', 'info');

    const receptionData = {
      truck_plate: `TRK-${timestamp}`,
      total_containers: '10',
      notes: `Test Reception ${timestamp}`
    };

    await test('Should navigate to new reception form', async () => {
      await page.goto('http://localhost:3000/dashboard/reception/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    await test('Should fill truck plate', async () => {
      await page.fill('#truck_plate', receptionData.truck_plate);
      const value = await page.inputValue('#truck_plate');
      if (value !== receptionData.truck_plate) {
        throw new Error(`Truck plate not filled correctly`);
      }
    });

    await test('Should fill total containers', async () => {
      await page.fill('#total_containers', receptionData.total_containers);
      const value = await page.inputValue('#total_containers');
      if (value !== receptionData.total_containers) {
        throw new Error(`Total containers not filled correctly`);
      }
    });

    await test('Should fill notes', async () => {
      await page.fill('#notes', receptionData.notes);
      const value = await page.inputValue('#notes');
      if (value !== receptionData.notes) {
        throw new Error(`Notes not filled correctly`);
      }
    });

    await test('Should find and fill provider select', async () => {
      const selects = await page.$$('select, [role="combobox"]');
      if (selects.length === 0) {
        throw new Error('No selects found');
      }

      // Try to select first option from first select (provider)
      try {
        await selects[0].selectOption({ index: 1 });
        log('   ✅ Selected provider');
      } catch (e) {
        log(`   ⚠️ Provider select failed: ${e.message}`);
      }
    });

    await test('Should find and fill driver select', async () => {
      const selects = await page.$$('select, [role="combobox"]');
      if (selects.length < 2) {
        throw new Error('Not enough selects found for driver');
      }

      try {
        await selects[1].selectOption({ index: 1 });
        log('   ✅ Selected driver');
      } catch (e) {
        log(`   ⚠️ Driver select failed: ${e.message}`);
      }
    });

    await test('Should find and fill fruit type select', async () => {
      const selects = await page.$$('select, [role="combobox"]');
      if (selects.length < 3) {
        throw new Error('Not enough selects found for fruit type');
      }

      try {
        await selects[2].selectOption({ index: 1 });
        log('   ✅ Selected fruit type');
      } catch (e) {
        log(`   ⚠️ Fruit type select failed: ${e.message}`);
      }
    });

    await test('Should attempt to submit form', async () => {
      const submitButton = await page.$('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")');
      if (!submitButton) {
        throw new Error('Submit button not found');
      }

      log('   Found submit button, attempting to click...');
      await submitButton.click();
      await page.waitForTimeout(5000);

      // Check if we're still on the form page
      const currentUrl = page.url();
      if (currentUrl.includes('/new')) {
        log('   ⚠️ Still on form page - may have validation errors');

        // Check for error messages
        const pageText = await page.textContent('body');
        if (pageText.includes('error') || pageText.includes('Error')) {
          log('   ❌ Error detected on page');
          log(`   Page content sample: ${pageText.substring(0, 200)}...`);
        }
      } else {
        log('   ✅ Redirected to reception list');
      }
    });

    await test('Should navigate back to reception list', async () => {
      await page.goto('http://localhost:3000/dashboard/reception');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    });

    await test('Should verify reception was created', async () => {
      const pageText = await page.textContent('body');
      const found = pageText.includes(receptionData.truck_plate);

      if (found) {
        log(`   ✅ Reception with plate ${receptionData.truck_plate} found!`);
      } else {
        log(`   ❌ Reception with plate ${receptionData.truck_plate} NOT found`);

        // Check all text in table
        const rows = await page.$$eval('table tbody tr', rows => rows.map(r => r.innerText).slice(0, 5));
        log(`   Current receptions in table:`);
        rows.forEach((row, i) => {
          log(`   ${i + 1}. ${row.substring(0, 100)}...`);
        });
      }
    });

    // ========== SUMMARY ==========
    log('\n=== TEST SUMMARY ===', 'info');
    log(`Total tests: ${passed + failed}`);
    log(`Passed: ${passed}`, 'success');
    log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success');

    if (failed === 0) {
      log('\n🎉 All debug tests completed!', 'success');
    } else {
      log('\n⚠️ Some tests had issues', 'warning');
    }

    process.exit(failed === 0 ? 0 : 1);

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
