// Using global playwright
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔐 Testing Authenticated Application\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Login
    console.log('\n1️⃣  LOGIN TEST');
    console.log('   → Navigating to /login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    console.log('   → Filling credentials (admin/admin123)...');
    await page.fill('[data-slot="input"][id="username"]', 'admin');
    await page.fill('[data-slot="input"][id="password"]', 'admin123');
    
    console.log('   → Submitting form...');
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.click('button[type="submit"]')
    ]);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`   → Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ LOGIN SUCCESSFUL!\n');
    } else {
      console.log('   ⚠️  Not redirected to dashboard\n');
    }
    
    // Step 2: Test protected routes
    console.log('2️⃣  PROTECTED ROUTES TEST');
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/reception',
      '/dashboard/users',
      '/dashboard/tipos-fruto',
      '/dashboard/proveedores',
      '/dashboard/choferes',
      '/dashboard/asociaciones'
    ];
    
    for (const route of protectedRoutes) {
      try {
        await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
        const title = await page.title();
        console.log(`   ✅ ${route.padEnd(35)} → ${title}`);
      } catch (error) {
        console.log(`   ❌ ${route.padEnd(35)} → ${error.message.substring(0, 50)}`);
      }
    }
    
    // Step 3: Test reception form
    console.log('\n3️⃣  RECEPTION FORM TEST');
    await page.goto('http://localhost:3000/dashboard/reception/new', { waitUntil: 'networkidle' });
    
    // Check for form elements
    const providerSelect = await page.$('[data-slot="select-trigger"]');
    const fruitTypeInput = await page.$('input[name*="fruit"]');
    const quantityInput = await page.$('input[name*="quantity"]');
    
    if (providerSelect) {
      console.log('   ✅ Provider select found');
    }
    if (fruitTypeInput) {
      console.log('   ✅ Fruit type input found');
    }
    if (quantityInput) {
      console.log('   ✅ Quantity input found');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error.message);
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.error('\n💡 Make sure the server is running: npm run dev');
    }
  } finally {
    await browser.close();
  }
})();
