#!/usr/bin/env node

const http = require('http');

function postRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = data;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': '' // We'll handle cookies manually
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      let cookies = [];

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        // Extract cookies from Set-Cookie headers
        if (res.headers['set-cookie']) {
          cookies = res.headers['set-cookie'].map(c => c.split(';')[0]);
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData,
          cookies,
          url: res.url || url
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

function getRequest(url, cookies = '') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Cookie': cookies
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData,
          url: res.url || url
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function runFullAuthTest() {
  console.log('\n🔐 Full JavaScript Authentication Test\n');
  console.log('='.repeat(60));

  let allCookies = '';

  try {
    // Step 1: Get login page
    console.log('\n1️⃣  GETTING LOGIN PAGE');
    const loginPage = await getRequest('http://localhost:3000/login');
    console.log(`   Status: ${loginPage.status}`);

    // Check for login form elements
    const hasUsernameField = loginPage.data.includes('id="username"');
    const hasPasswordField = loginPage.data.includes('id="password"');
    const hasSubmitButton = loginPage.data.includes('Iniciar Sesión');

    console.log(`   Username field: ${hasUsernameField ? '✅' : '❌'}`);
    console.log(`   Password field: ${hasPasswordField ? '✅' : '❌'}`);
    console.log(`   Submit button: ${hasSubmitButton ? '✅' : '❌'}`);
    console.log(`   ✅ Login form ready\n`);

    // Step 2: Submit login (simulate form submission)
    console.log('2️⃣  SUBMITTING LOGIN');
    const formData = 'username=admin&password=admin123';
    const loginResponse = await postRequest('http://localhost:3000/login', formData);
    console.log(`   Status: ${loginResponse.status}`);

    // Extract session cookies
    if (loginResponse.cookies.length > 0) {
      allCookies = loginResponse.cookies.join('; ');
      console.log(`   Cookies received: ${loginResponse.cookies.length}`);
      console.log(`   ✅ Session established\n`);
    } else {
      console.log(`   ⚠️  No cookies received\n`);
    }

    // Step 3: Try to access dashboard with cookies
    console.log('3️⃣  ACCESSING PROTECTED ROUTE (with cookies)');
    const dashboardRes = await getRequest('http://localhost:3000/dashboard', allCookies);
    console.log(`   Status: ${dashboardRes.status}`);

    if (dashboardRes.status === 200) {
      console.log(`   ✅ Successfully accessed dashboard!\n`);
    } else if (dashboardRes.status === 307) {
      console.log(`   → Redirecting to: ${dashboardRes.headers.location}`);
      console.log(`   ⚠️  Still requires authentication\n`);
    }

    // Step 4: Test all protected routes
    console.log('4️⃣  TESTING ALL DASHBOARD ROUTES');
    const routes = [
      '/dashboard',
      '/dashboard/reception',
      '/dashboard/reception/new',
      '/dashboard/users',
      '/dashboard/tipos-fruto',
      '/dashboard/proveedores',
      '/dashboard/choferes',
      '/dashboard/asociaciones'
    ];

    for (const route of routes) {
      try {
        const res = await getRequest(`http://localhost:3000${route}`, allCookies);
        const status = res.status;
        const indicator = status === 200 ? '✅' : status === 307 ? '⚠️' : '❌';
        console.log(`   ${indicator} ${route.padEnd(35)} → ${status}`);
      } catch (err) {
        console.log(`   ❌ ${route.padEnd(35)} → ERROR`);
      }
    }

    // Step 5: Check reception form
    console.log('\n5️⃣  CHECKING RECEPTION FORM');
    const receptionForm = await getRequest('http://localhost:3000/dashboard/reception/new', allCookies);

    if (receptionForm.status === 200) {
      const hasProviderSelect = receptionForm.data.includes('Proveedor');
      const hasFruitType = receptionForm.data.includes('fruit');
      const hasQuantity = receptionForm.data.includes('quantity');

      console.log(`   Form loaded: ✅`);
      console.log(`   Provider select: ${hasProviderSelect ? '✅' : '❌'}`);
      console.log(`   Fruit type field: ${hasFruitType ? '✅' : '❌'}`);
      console.log(`   Quantity field: ${hasQuantity ? '✅' : '❌'}`);
    } else {
      console.log(`   ⚠️  Form requires authentication (${receptionForm.status})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ AUTHENTICATION TEST COMPLETED!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure server is running: npm run dev');
    }
  }
}

runFullAuthTest();
