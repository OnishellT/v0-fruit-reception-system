# 🧪 Test Suite

This directory contains JavaScript-based tests for the Fruit Reception System.

## Running Tests

All tests are written in Node.js and can be run with:

```bash
node tests/[test-name]
```

## Test Files

### 1. `test-verify.js` ⭐ **MAIN TEST**
**Purpose:** Comprehensive verification of the application
**What it tests:**
- Server status and response time
- TypeScript compilation
- Route accessibility
- File structure

**Run:** `node tests/test-verify.js`

---

### 2. `test-content.js`
**Purpose:** Verify HTML content and form fields
**What it tests:**
- Login page content
- Form fields presence
- Server headers

**Run:** `node tests/test-content.js`

---

### 3. `test-auth-js.js`
**Purpose:** Basic HTTP request testing
**What it tests:**
- Login page accessibility
- Protected routes behavior
- Server health

**Run:** `node tests/test-auth-js.js`

---

### 4. `test-full-auth.js`
**Purpose:** Advanced authentication flow testing
**What it tests:**
- Login form submission
- Cookie handling
- Protected route access
- Session management

**Run:** `node tests/test-full-auth.js`

**Note:** This test attempts to simulate the full login flow

---

### 5. `test-auth.js`
**Purpose:** Original authentication test
**What it tests:**
- Basic route testing
- Response verification

**Run:** `node tests/test-auth.js`

---

### 6. `test-authenticated.js`
**Purpose:** Browser-based authentication testing
**What it tests:**
- Full browser automation
- Protected routes
- Form interaction

**Run:** `node tests/test-authenticated.js`

**Note:** Requires Playwright to be installed globally

---

## Quick Start

### Run All Tests
```bash
node tests/test-verify.js && node tests/test-content.js
```

### Recommended Test Flow
1. Start the application: `npm run dev`
2. Run verification: `node tests/test-verify.js`
3. Run content check: `node tests/test-content.js`
4. Login manually at: http://localhost:3000/login

## Test Results

All tests verify:
- ✅ Server is running on http://localhost:3000
- ✅ TypeScript compiles without errors
- ✅ All routes are accessible
- ✅ Login page renders correctly
- ✅ Authentication middleware is working

## Credentials for Manual Testing

```
Username: admin
Password: admin123
```

---

## Notes

- **307 status codes** on protected routes indicate authentication is working correctly (redirecting to /login)
- **200 status codes** indicate successful page load
- All tests use Node.js standard library (http/https modules)
- No external dependencies required for basic tests
