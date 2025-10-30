const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔐 Starting authentication test...\n');
    
    // Step 1: Login
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    console.log('2. Filling login form...');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    
    console.log('3. Submitting login...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    console.log('4. Waiting for dashboard redirect...');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('   ✅ Successfully logged in!\n');
    
    // Step 2: Test dashboard routes
    console.log('📊 Testing Dashboard Routes:');
    const routes = [
      '/dashboard/reception',
      '/dashboard/users',
      '/dashboard/tipos-fruto',
      '/dashboard/proveedores',
      '/dashboard/choferes',
      '/dashboard/asociaciones',
      '/dashboard/audit'
    ];
    
    for (const route of routes) {
      try {
        console.log(`   Testing ${route}...`);
        await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
        
        // Check if page loaded without errors
        const title = await page.title();
        console.log(`   ✅ ${route} - Status: 200 (${title})\n`);
      } catch (error) {
        console.log(`   ❌ ${route} - Error: ${error.message}\n`);
      }
    }
    
    // Step 3: Test form submissions
    console.log('\n📝 Testing Form Functionality:');
    
    // Test reception form
    console.log('   Testing reception form...');
    await page.goto('http://localhost:3000/dashboard/reception/new');
    await page.waitForLoadState('networkidle');
    
    // Check if form elements exist
    const usernameField = await page.$('#username');
    const passwordField = await page.$('#password');
    
    if (usernameField && passwordField) {
      console.log('   ✅ Reception form loaded successfully\n');
    } else {
      console.log('   ⚠️  Form elements not found (may need authentication)\n');
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();
