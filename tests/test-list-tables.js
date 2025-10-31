const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 Checking Database Tables\n');

    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Check each page for errors
    const pages = [
      '/dashboard/proveedores',
      '/dashboard/choferes',
      '/dashboard/tipos-fruto',
      '/dashboard/asociaciones',
      '/dashboard/reception'
    ];

    for (let p of pages) {
      console.log(`Checking ${p}...`);
      await page.goto(`http://localhost:3000${p}`);
      await page.waitForLoadState('networkidle');
      
      const text = await page.textContent('body');
      
      if (text.includes('Error de Base de Datos') || text.includes('does not exist')) {
        console.log(`   ❌ Database error on ${p}`);
      } else {
        const rows = await page.$$eval('table tbody tr', rows => rows.length);
        console.log(`   ✅ ${p} - ${rows} rows in table`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
