const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 Debug Test - Providers Table\n');

    // Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('   ✅ Logged in!\n');

    // Create provider
    const timestamp = Date.now();
    const providerData = {
      code: `PROV${timestamp}`,
      name: `Test Provider ${timestamp}`,
      contact: `Test Contact ${timestamp}`,
      phone: '809-555-0001',
      address: 'Test Address 123'
    };

    console.log('2. Creating provider:', providerData.code);
    await page.goto('http://localhost:3000/dashboard/proveedores/new');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="code"]', providerData.code);
    await page.fill('input[name="name"]', providerData.name);
    await page.fill('input[name="contact"]', providerData.contact);
    await page.fill('input[name="phone"]', providerData.phone);
    await page.fill('input[name="address"]', providerData.address);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.waitForURL('**/dashboard/proveedores', { timeout: 5000 });
    console.log('   ✅ Provider created!\n');

    // Debug: Check what's in the table
    console.log('3. Debugging table contents...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check URL
    const url = page.url();
    console.log('   Current URL:', url);

    // Check if provider by code is in the page source
    const pageContent = await page.textContent('body');
    const foundInPage = pageContent.includes(providerData.code);
    console.log(`   Provider code "${providerData.code}" in page:`, foundInPage);

    // Check all text content for provider name
    const allText = await page.innerText('body');
    const nameFound = allText.includes(providerData.name);
    console.log(`   Provider name "${providerData.name}" in page:`, nameFound);

    // List all visible text in the table
    const tableRows = await page.$$eval('table tbody tr', rows => {
      return rows.map(row => row.innerText).slice(0, 5);
    });
    console.log('   Table rows (first 5):', tableRows);

    // Check pagination buttons
    const allButtons = await page.$$('button');
    const buttonTexts = [];
    for (let btn of allButtons) {
      try {
        const text = await btn.innerText();
        if (text && text.trim()) buttonTexts.push(text.trim());
      } catch (e) {}
    }
    console.log('   All buttons:', buttonTexts.slice(0, 10));

    console.log('\n✅ Debug test completed!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();
