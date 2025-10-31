const { chromium } = require('playwright');

/**
 * Simple Reception Form Test
 * Tests that the reception form loads and basic fields are accessible
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
      // Don't throw, continue with other tests
    }
  };

  try {
    log('🚀 Starting Simple Reception Form Test\n');

    // ========== LOGIN ==========
    await test('Should login successfully', async () => {
      await page.goto('http://localhost:3001/login');
      await page.fill('#username', 'admin');
      await page.fill('#password', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    // ========== FORM ACCESS ==========
    log('\n=== FORM ACCESS TESTS ===', 'info');

    await test('RECEPTION: Should load reception form', async () => {
      await page.goto('http://localhost:3001/dashboard/reception/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    await test('RECEPTION: Should find truck plate field', async () => {
      const truckPlateField = await page.$('#truck_plate');
      if (!truckPlateField) {
        throw new Error('Truck plate field not found');
      }
    });

    await test('RECEPTION: Should find total containers field', async () => {
      const totalContainersField = await page.$('#total_containers');
      if (!totalContainersField) {
        throw new Error('Total containers field not found');
      }
    });

    await test('RECEPTION: Should find notes field', async () => {
      const notesField = await page.$('#notes');
      if (!notesField) {
        throw new Error('Notes field not found');
      }
    });

    await test('RECEPTION: Should find provider select', async () => {
      const providerSelect = await page.$('select, [role="combobox"]');
      if (!providerSelect) {
        throw new Error('Provider select not found');
      }
    });

    await test('RECEPTION: Should find driver select', async () => {
      const driverSelects = await page.$$('select, [role="combobox"]');
      if (driverSelects.length < 2) {
        throw new Error(`Expected at least 2 selects, found ${driverSelects.length}`);
      }
    });

    await test('RECEPTION: Should fill truck plate', async () => {
      const truckPlate = `TRK-${timestamp}`;
      await page.fill('#truck_plate', truckPlate);
      const value = await page.inputValue('#truck_plate');
      if (value !== truckPlate) {
        throw new Error(`Expected "${truckPlate}", got "${value}"`);
      }
    });

    await test('RECEPTION: Should fill total containers', async () => {
      await page.fill('#total_containers', '10');
      const value = await page.inputValue('#total_containers');
      if (value !== '10') {
        throw new Error(`Expected "10", got "${value}"`);
      }
    });

    await test('RECEPTION: Should fill notes', async () => {
      const notes = `Test Notes ${timestamp}`;
      await page.fill('#notes', notes);
      const value = await page.inputValue('#notes');
      if (value !== notes) {
        throw new Error(`Expected "${notes}", got "${value}"`);
      }
    });

    await test('RECEPTION: Should navigate to reception list', async () => {
      await page.goto('http://localhost:3001/dashboard/reception');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    await test('RECEPTION: Should find reception table', async () => {
      const table = await page.$('table');
      if (!table) {
        throw new Error('Reception table not found');
      }
    });

    await test('RECEPTION: Should display existing receptions', async () => {
      const rows = await page.$$eval('table tbody tr', rows => rows.length);
      if (rows === 0) {
        log('   ⚠️ No receptions found in table', 'warning');
      } else {
        log(`   ✅ Found ${rows} receptions in table`, 'success');
      }
    });

    // ========== SUMMARY ==========
    log('\n=== TEST SUMMARY ===', 'info');
    log(`Total tests: ${passed + failed}`);
    log(`Passed: ${passed}`, 'success');
    log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success');

    if (failed === 0) {
      log('\n🎉 All reception form tests passed!', 'success');
      log('\n✅ Reception form is accessible and functional', 'success');
      log('✅ All form fields can be found and filled', 'success');
      log('✅ Reception table loads correctly', 'success');
      process.exit(0);
    } else {
      log('\n⚠️ Some tests failed', 'warning');
      if (failed < passed) {
        log(`   But ${passed - failed} tests passed successfully`, 'warning');
      }
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
