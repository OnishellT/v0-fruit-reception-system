const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.type(), msg.text());
  });

  // Capture network errors
  page.on('response', async (response) => {
    if (response.url().includes('/dashboard/proveedores/new')) {
      console.log('\n📡 Response for create request:');
      console.log('   URL:', response.url());
      console.log('   Status:', response.status());
      if (response.status() >= 400) {
        const text = await response.text();
        console.log('   Error response:', text.substring(0, 500));
      }
    }
  });

  try {
    console.log('🧪 Checking for Errors\n');

    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    const timestamp = Date.now();
    const providerData = {
      code: `ERR${timestamp}`,
      name: `Error Test ${timestamp}`,
      contact: `Contact ${timestamp}`,
      phone: '809-555-9999',
      address: 'Address 123'
    };

    console.log('Creating provider:', providerData.code);

    await page.goto('http://localhost:3000/dashboard/proveedores/new');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="code"]', providerData.code);
    await page.fill('input[name="name"]', providerData.name);
    await page.fill('input[name="contact"]', providerData.contact);
    await page.fill('input[name="phone"]', providerData.phone);
    await page.fill('input[name="address"]', providerData.address);

    console.log('\nSubmitting form...\n');
    await page.click('button[type="submit"]');
    
    // Wait and check for errors
    await page.waitForTimeout(5000);

    // Check if we're still on the form page (error)
    const currentUrl = page.url();
    console.log('\nCurrent URL after submit:', currentUrl);

    if (currentUrl.includes('/new')) {
      console.log('⚠️ Still on form page - likely an error occurred');
      
      // Check for error messages
      const errorText = await page.textContent('body');
      if (errorText.includes('error') || errorText.includes('Error') || errorText.includes('error')) {
        console.log('\n❌ Error detected in page:');
        console.log(errorText.substring(0, 1000));
      }
    } else {
      console.log('✅ Redirected successfully');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
