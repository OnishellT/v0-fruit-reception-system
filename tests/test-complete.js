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
    log('🚀 Starting Minimal Test Suite\n');

    // ========== AUTHENTICATION TESTS ==========
    log('\n=== AUTHENTICATION TESTS ===', 'info');

    await test('Should login successfully', async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('#username', 'admin');
      await page.fill('#password', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      const url = page.url();
      if (!url.includes('/dashboard')) {
        throw new Error('Failed to redirect to dashboard');
      }
    });

    // ========== PAGE NAVIGATION TESTS ==========
    log('\n=== PAGE NAVIGATION TESTS ===', 'info');

    const routes = [
      '/dashboard',
      '/dashboard/reception',
      '/dashboard/users',
      '/dashboard/tipos-fruto',
      '/dashboard/proveedores',
      '/dashboard/choferes',
      '/dashboard/asociaciones',
      '/dashboard/audit'
    ];

    for (const route of routes) {
      await test(`Should navigate to ${route}`, async () => {
        await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
        const title = await page.title();
        if (!title) {
          throw new Error(`Page did not load: ${route}`);
        }
      });
    }

    // ========== CRUD OPERATIONS TESTS ==========
    log('\n=== CRUD OPERATIONS TESTS ===', 'info');

    // Test Provider Creation
    await test('Should create new provider', async () => {
      const timestamp = Date.now();
      const testProvider = {
        code: `TEST${timestamp}`,
        name: `Test Provider ${timestamp}`,
        contact: `Test Contact ${timestamp}`,
        phone: '809-555-0001',
        address: 'Test Address 123'
      };

      await page.goto('http://localhost:3000/dashboard/proveedores/new');
      await page.waitForLoadState('networkidle');

      // Fill form
      await page.fill('input[name="code"]', testProvider.code);
      await page.fill('input[name="name"]', testProvider.name);
      await page.fill('input[name="contact"]', testProvider.contact);
      await page.fill('input[name="phone"]', testProvider.phone);
      await page.fill('input[name="address"]', testProvider.address);

      // Submit
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Verify redirect to providers list
      await page.waitForURL('**/dashboard/proveedores', { timeout: 5000 });

      // Verify in list
      const providerText = await page.textContent('text=' + testProvider.name);
      if (!providerText) {
        throw new Error('Created provider not found in list');
      }
    });

    // ========== FINAL REPORT ==========
    log('\n=== TEST SUMMARY ===', 'info');
    log(`Total tests: ${passed + failed}`);
    log(`Passed: ${passed}`, 'success');
    log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success');

    if (failed === 0) {
      log('\n🎉 All tests passed!', 'success');
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
