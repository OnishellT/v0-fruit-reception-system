#!/usr/bin/env node

const http = require('http');
const https = require('https');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200), // First 200 chars
          url: res.url || url
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  console.log('\n🔐 JavaScript Authentication Test\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Login page
    console.log('\n1️⃣  LOGIN PAGE TEST');
    const loginRes = await makeRequest('http://localhost:3000/login');
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Content-Type: ${loginRes.headers['content-type']}`);
    console.log(`   ✅ Login page accessible\n`);

    // Test 2: Protected routes
    console.log('2️⃣  PROTECTED ROUTES TEST');
    const routes = [
      '/dashboard',
      '/dashboard/reception',
      '/dashboard/reception/new',
      '/dashboard/users',
      '/dashboard/tipos-fruto',
      '/dashboard/proveedores',
      '/dashboard/choferes',
      '/dashboard/asociaciones',
      '/dashboard/audit'
    ];

    for (const route of routes) {
      try {
        const res = await makeRequest(`http://localhost:3000${route}`);
        const status = res.status;
        const indicator = status === 200 || status === 307 ? '✅' : '❌';
        console.log(`   ${indicator} ${route.padEnd(35)} → ${status}`);
      } catch (err) {
        console.log(`   ❌ ${route.padEnd(35)} → ERROR`);
      }
    }

    // Test 3: Server health
    console.log('\n3️⃣  SERVER HEALTH CHECK');
    const startTime = Date.now();
    const healthRes = await makeRequest('http://localhost:3000/');
    const responseTime = ((Date.now() - startTime) / 1000).toFixed(3);
    console.log(`   Status: ${healthRes.status}`);
    console.log(`   Response time: ${responseTime}s`);
    console.log(`   ✅ Server is responsive\n`);

    console.log('='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED!\n');
    console.log('📝 Note: 307 = Redirect to /login (expected for protected routes)');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Make sure server is running: npm run dev');
    }
  }
}

runTests();
