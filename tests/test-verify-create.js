const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 Testing Provider Creation with Details\n');

    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    const timestamp = Date.now();
    const providerData = {
      code: `TEST${timestamp}`,
      name: `Provider Name ${timestamp}`,
      contact: `Contact ${timestamp}`,
      phone: '809-555-9999',
      address: 'Address 123'
    };

    console.log('Creating provider with data:', providerData);

    await page.goto('http://localhost:3000/dashboard/proveedores/new');
    await page.waitForLoadState('networkidle');

    // Fill form
    console.log('\n1. Filling form...');
    await page.fill('input[name="code"]', providerData.code);
    console.log('   ✅ Filled code:', providerData.code);

    await page.fill('input[name="name"]', providerData.name);
    console.log('   ✅ Filled name:', providerData.name);

    await page.fill('input[name="contact"]', providerData.contact);
    console.log('   ✅ Filled contact');

    await page.fill('input[name="phone"]', providerData.phone);
    console.log('   ✅ Filled phone');

    await page.fill('input[name="address"]', providerData.address);
    console.log('   ✅ Filled address');

    // Take screenshot before submit
    console.log('\n2. Taking screenshot before submit...');
    await page.screenshot({ path: 'before-submit.png' });

    console.log('\n3. Submitting form...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Check for errors
    const errorElements = await page.$$('.text-destructive, [class*="error"], [class*="alert"]');
    if (errorElements.length > 0) {
      const errorText = await page.textContent('body');
      console.log('   ⚠️ Error detected:', errorText.substring(0, 500));
    }

    await page.waitForURL('**/dashboard/proveedores', { timeout: 5000 });
    console.log('   ✅ Redirected to providers list\n');

    // Navigate to last page and check
    console.log('4. Checking table...');
    const allButtons = await page.$$('button');
    const buttonTexts = [];
    for (let btn of allButtons) {
      try {
        const text = await btn.innerText();
        if (text && text.trim() === '2') {
          await btn.click();
          await page.waitForLoadState('networkidle');
          console.log('   ✅ Clicked page 2');
          break;
        }
      } catch (e) {}
    }

    // Look for our provider
    const pageText = await page.textContent('body');
    const codeFound = pageText.includes(providerData.code);
    const nameFound = pageText.includes(providerData.name);

    console.log(`   Code found: ${codeFound}`);
    console.log(`   Name found: ${nameFound}`);

    if (codeFound && nameFound) {
      console.log('\n✅ Provider created and verified successfully!');
    } else if (codeFound && !nameFound) {
      console.log('\n⚠️ Provider code exists but name is missing!');
    } else {
      console.log('\n❌ Provider not found at all!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
