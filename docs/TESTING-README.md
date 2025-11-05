# Fruit Reception System - Testing Suite

This directory contains comprehensive automated tests for all features implemented in the Fruit Reception System.

## Features Tested

### ✅ Implemented & Tested Features

1. **Authentication & Login**
   - Admin login with credentials validation
   - Session management and logout
   - Role-based access control

2. **Reception Management**
   - Create/edit reception forms
   - Provider and driver selection
   - Fruit type and weight management
   - Reception status tracking

3. **Café Quality Evaluation**
   - Quality metrics: Violetas, Humedad, Moho (0-100%)
   - Modal-based quality entry
   - Role-based permissions (Admin vs Operator)
   - Quality data persistence

4. **Weight Discount System**
   - Automatic weight discounts based on quality thresholds
   - Discount breakdown visualization
   - Real-time calculation updates
   - Admin manual adjustments

5. **Quality-Based Pricing System**
   - Dynamic pricing rules per fruit type
   - Configurable discount thresholds
   - Pricing preview and calculations
   - Historical pricing integrity

6. **Cacao Processing Module**
   - Laboratory sample management
   - Batch processing workflows
   - Drying and fermentation tracking
   - Quality result integration

7. **Dashboard & Analytics**
   - Reception statistics
   - Daily activity tracking
   - Progress indicators
   - Navigation and layout

8. **Database Integrity**
   - Table structure validation
   - Foreign key constraints
   - Row Level Security (RLS)
   - Trigger functionality
   - Data seeding verification

9. **API Endpoints**
   - REST API availability
   - Authentication requirements
   - Request/response validation
   - Error handling

10. **Browser Automation**
    - End-to-end login flow
    - Form interactions
    - Navigation testing
    - Visual regression detection

## Test Files

### Main Test Runner
- `run-all-tests.js` - Orchestrates all test suites

### Individual Test Suites
- `tests/test-suite.js` - Browser automation and UI tests
- `tests/test-database.js` - Database integrity and operations
- `tests/test-api.js` - API endpoint testing
- `tests/test-login-detailed.js` - Detailed login flow testing

### Utility Scripts
- `tests/test-login.js` - Basic login testing
- `tests/check-db-status.js` - Database status verification
- `tests/check-admin-user.js` - Admin user validation

## Prerequisites

### System Requirements
- Node.js 18+
- Playwright installed
- Next.js development server running
- Supabase database accessible

### Environment Setup
Ensure these environment variables are set:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Start Development Server
```bash
npm run dev
```

## Running Tests

### Run All Tests
```bash
node tests/run-all-tests.js
```

### Run Individual Test Suites

#### Database Tests
```bash
node tests/test-database.js
```

#### API Tests
```bash
node tests/test-api.js
```

#### Browser Automation Tests
```bash
node tests/test-suite.js
```

#### Detailed Login Tests
```bash
node tests/test-login-detailed.js
```

### Run with Environment Variables
```bash
SUPABASE_SERVICE_ROLE_KEY=your-key NEXT_PUBLIC_SUPABASE_URL=your-url node tests/test-database.js
```

## Test Results

### Success Criteria
- **Database Tests**: All core tables exist, admin user present, RLS enabled
- **API Tests**: Endpoints respond appropriately (may skip if not implemented)
- **Browser Tests**: Login flow works, UI elements accessible
- **Overall**: >80% test success rate for implemented features

### Expected Output
```
🚀 Running Database Tests...
✅ Database connection: passed
✅ Users table exists and has data: passed
✅ Admin user exists with correct credentials: passed
...

📊 COMPREHENSIVE TEST RESULTS SUMMARY
============================================================
Test Suites: 4
Total Tests: 42
✅ Passed: 38
❌ Failed: 2
⏭️ Skipped: 2
📈 Overall Success Rate: 90.5%
```

## Test Coverage

### By Feature Area

| Feature | Tests | Status |
|---------|-------|--------|
| Authentication | 3 | ✅ Complete |
| Reception Management | 4 | ✅ Complete |
| Café Quality | 3 | ⚠️ Partial |
| Weight Discounts | 3 | ⚠️ Partial |
| Pricing System | 3 | ⚠️ Partial |
| Cacao Processing | 3 | ⚠️ Partial |
| Dashboard | 3 | ✅ Complete |
| Database | 12 | ✅ Complete |
| API Endpoints | 8 | ⚠️ Partial |
| Browser Automation | 10 | ✅ Complete |

### Test Types

- **Unit Tests**: Database functions, API responses
- **Integration Tests**: End-to-end workflows
- **UI Tests**: Browser automation, form interactions
- **Data Integrity**: Constraints, triggers, RLS
- **Performance**: Query response times

## Troubleshooting

### Common Issues

#### Database Connection Failed
```
❌ Database connection: failed - supabaseKey is required
```
**Solution**: Set `SUPABASE_SERVICE_ROLE_KEY` environment variable

#### Next.js Server Not Running
```
❌ Next.js dev server is not accessible
```
**Solution**: Run `npm run dev` in another terminal

#### Tests Timeout
```
Error: Timeout of 300000ms exceeded
```
**Solution**: Check if browser automation tests are hanging

#### Playwright Not Found
```
Error: Cannot find module 'playwright'
```
**Solution**: Install Playwright: `npm install playwright`

### Skipping Tests

Some tests are designed to skip gracefully if features aren't implemented:
- API endpoints return 404
- Database tables don't exist
- UI elements not present

This allows the test suite to run on partially implemented systems.

## Continuous Integration

### GitHub Actions Setup
```yaml
- name: Run Tests
  run: node run-all-tests.js
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

### Pre-deployment Checks
```bash
# Run all tests
node run-all-tests.js

# Check test results
if [ $? -ne 0 ]; then
  echo "Tests failed - blocking deployment"
  exit 1
fi
```

## Contributing

### Adding New Tests

1. Create test file: `test-feature-name.js`
2. Follow the TestSuite pattern
3. Add to `run-all-tests.js`
4. Update this README

### Test Structure
```javascript
async function runFeatureTests(suite) {
  await suite.runTest('Test description', async () => {
    // Test implementation
  });
}
```

## Support

For issues with:
- **Database**: Check Supabase dashboard
- **API**: Review Next.js server logs
- **Browser**: Check Playwright installation
- **Environment**: Verify `.env.local` file

## Version History

- **v1.0**: Initial comprehensive test suite
- Features: Auth, Reception, Quality, Pricing, Cacao, Dashboard
- Coverage: Database, API, Browser automation