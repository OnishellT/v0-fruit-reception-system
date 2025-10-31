const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 Checking Database Setup\n');

    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    console.log('1. Checking providers page for errors...');
    await page.goto('http://localhost:3000/dashboard/proveedores');
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    
    // Check for database error
    if (pageText.includes('Error de Base de Datos') || 
        pageText.includes('asociaciones') ||
        pageText.includes('relationship') ||
        pageText.includes('does not exist')) {
      console.log('   ❌ Database setup error detected!');
      console.log('\n   Error message:');
      const errorMatch = pageText.match(/Error de Base de Datos[\s\S]*?(?=\n\n|\Z)/);
      if (errorMatch) {
        console.log(errorMatch[0].substring(0, 500));
      }
      return;
    }

    console.log('   ✅ No database setup errors found');

    // Check if table has data
    const tableRows = await page.$$eval('table tbody tr', rows => rows.length);
    console.log(`\n2. Table has ${tableRows} rows`);

    if (tableRows === 0) {
      console.log('   ⚠️ Table is empty - possible database issue');
    } else {
      console.log('   ✅ Table has data');
    }

    console.log('\n3. Checking if we can read existing providers...');
    const firstRow = await page.$$eval('table tbody tr', rows => {
      if (rows.length > 0) return rows[0].innerText;
      return null;
    });
    
    if (firstRow) {
      console.log('   ✅ Can read table data:');
      console.log('   ', firstRow.substring(0, 80));
    } else {
      console.log('   ❌ Cannot read table data');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
