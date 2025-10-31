# Fruit Reception System - Test Suite

Simple test suite for the Fruit Reception System using Playwright (Node.js).

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Files](#test-files)
- [Writing Tests](#writing-tests)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This test suite provides comprehensive coverage of the Fruit Reception System:

- ✅ Authentication flow
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Form submissions and validations
- ✅ Search and filtering
- ✅ Sorting functionality
- ✅ Pagination
- ✅ Mobile responsiveness
- ✅ Error handling

## 📦 Prerequisites

- Node.js 16+ installed
- Development server running on port 3000
- Playwright library (installed automatically with npm install)

## 🚀 Installation

```bash
npm install
```

## ▶️ Running Tests

### Quick Start

Run all tests with the test runner script:

```bash
./tests/run-tests.sh
```

### Manual Test Execution

#### 1. Authentication Tests

```bash
npm test
# or
node tests/test-auth.js
```

#### 2. Comprehensive Test Suite

```bash
npm run test:comprehensive
# or
node tests/test-complete.js
```

#### 3. Test Data Manager

```bash
node tests/test-data-manager.js
```

### Test Server Management

The test runner automatically starts the dev server if not running. To start manually:

```bash
npm run dev
```

Then run tests in another terminal:

```bash
./tests/run-tests.sh
```

## 📁 Test Files

```
tests/
├── run-tests.sh              # Main test runner script
├── test-auth.js              # Authentication tests
├── test-complete.js          # Comprehensive test suite
├── test-data-manager.js      # Test data management
├── test-utils.js             # Test helper utilities
└── README.md                 # This file
```

## ✍️ Writing Tests

### Test Pattern

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test steps
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ Test passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
```

### Using Test Utilities

```javascript
const { chromium } = require('playwright');
const {
  login,
  createProvider,
  waitForTable
} = require('./test-utils');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Login using utility
    await login(page);
    
    // Create provider using utility
    const provider = await createProvider(page);
    console.log('Created:', provider.name);
    
    // Verify in table
    await page.goto('/dashboard/proveedores');
    await waitForTable(page);
    
    console.log('✅ Test passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
```

## 🔧 Test Utilities

### Available Functions

```javascript
const utils = require('./test-utils');

// Login
await utils.login(page, { username: 'admin', password: 'admin123' });

// Create test data
const provider = await utils.createProvider(page, {
  code: 'TEST123',
  name: 'Test Provider'
});

const driver = await utils.createDriver(page, {
  name: 'Test Driver',
  license_number: 'LIC123'
});

const fruitType = await utils.createFruitType(page, {
  type: 'Test Type',
  subtype: 'Test Subtype'
});

const reception = await utils.createReception(page, {
  truck_plate: 'TEST-123',
  total_containers: 10
});

// Table operations
await utils.waitForTable(page);
await utils.searchInTable(page, 'search term');
await utils.sortByColumn(page, 'Nombre');

// Viewport
await utils.setMobileViewport(page);
await utils.setDesktopViewport(page);
```

## 🔍 Common Patterns

### Authentication

```javascript
// Login
await page.goto('/login');
await page.fill('input[name="username"]', 'admin');
await page.fill('input[name="password"]', 'admin123');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard');

// Logout
await page.click('button:has-text("Cerrar Sesión")');
```

### Form Submission

```javascript
// Fill form
await page.fill('input[name="field1"]', 'value1');
await page.selectOption('select[name="field2"]', { index: 1 });

// Submit
await page.click('button[type="submit"]');
await page.waitForURL('**/success-page');
```

### Search and Filter

```javascript
const searchInput = page.locator('input[placeholder*="Buscar"]');
await searchInput.fill('search term');
await page.waitForTimeout(1000);
```

### Table Operations

```javascript
await page.waitForSelector('table');
await page.waitForLoadState('networkidle');

// Sort
await page.click('th:has-text("Column Name")');
await page.waitForTimeout(500);
```

### Mobile Testing

```javascript
await page.setViewportSize({ width: 375, height: 667 });
await page.goto('/dashboard/reception');
await expect(page.locator('table')).toBeVisible();
```

## 🔧 Troubleshooting

### Server Not Running

```bash
npm run dev
```

### Port Already in Use

```bash
lsof -ti:3000 | xargs kill -9
PORT=3001 npm run dev
```

### Tests Timing Out

Increase timeout in test:

```javascript
await page.goto('http://localhost:3000/dashboard', {
  timeout: 60000
});
```

### Debugging Tests

```javascript
// Run in non-headless mode
const browser = await chromium.launch({
  headless: false,
  slowMo: 1000
});

// Add delays
await page.waitForTimeout(2000);
```

## 📊 Test Coverage

### Features Tested

- [x] Authentication (login/logout)
- [x] Dashboard navigation
- [x] Providers CRUD
- [x] Drivers CRUD
- [x] Fruit Types CRUD
- [x] Associations CRUD
- [x] Receptions CRUD
- [x] User management
- [x] Audit logs
- [x] Search functionality
- [x] Sorting
- [x] Pagination
- [x] Mobile responsiveness
- [x] Error handling

### Test Data

Tests create their own data with unique timestamps:

```javascript
const timestamp = Date.now();
const testData = {
  name: `Test ${timestamp}`,
  // ...
};
```

## 📝 Best Practices

1. **Use Test Utilities**: Leverage `test-utils.js` for common operations
2. **Cleanup**: Tests should clean up after themselves
3. **Unique Data**: Use timestamps to ensure unique test data
4. **Wait for Elements**: Always wait for elements before interacting
5. **Screenshots**: Use `await page.screenshot()` for debugging
6. **Isolation**: Each test should be independent

## 📞 Support

For issues:
1. Check this README
2. Review test output
3. Run tests with longer timeouts
4. Check if server is running

## 🚀 Quick Reference

```bash
# Run all tests
./tests/run-tests.sh

# Run authentication tests
npm test
node tests/test-auth.js

# Run comprehensive tests
npm run test:comprehensive
node tests/test-complete.js

# Run test data manager
node tests/test-data-manager.js
```

---

**Happy Testing! 🎉**