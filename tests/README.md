# Fruit Reception System - Comprehensive Test Suite

This directory contains a comprehensive test suite for the Fruit Reception System, covering all major functionality including entity management, reception creation, quality evaluation, discount calculations, and cacao processing workflows.

## Test Structure

```
tests/
├── automated/                    # Comprehensive automated tests
│   ├── test-entity-crud-comprehensive.js      # Entity CRUD operations
│   ├── test-reception-creation-comprehensive.js # Reception creation with quality
│   ├── test-cacao-lab-samples.js              # Cacao lab sample workflows
│   ├── test-quality-discount-verification.js  # Quality & discount verification
│   └── test-complete-e2e-workflow.js          # Complete end-to-end workflow
├── simple/                      # Basic functionality tests
├── api/                         # API endpoint tests
├── db/                          # Database connectivity tests
└── debug/                       # Development debugging tests
```

## Available Test Commands

### Individual Test Suites

```bash
# Entity CRUD Operations (create, read, update entities)
npm run test:entity-crud

# Reception Creation with Quality Data
npm run test:reception-creation

# Cacao Lab Samples & Processing
npm run test:cacao-lab

# Quality Measurements & Discount Calculations
npm run test:quality-discounts

# Complete End-to-End Workflow
npm run test:e2e-complete
```

### Legacy Tests

```bash
# Basic functionality tests
npm run test:simple

# Authentication tests
npm run test:auth

# Database connectivity
npm run test:database

# Enhanced MCP debugging
npm run test:enhanced
```

## Test Coverage

### ✅ Entity Management
- **Associations**: Create, edit, verify in tables
- **Providers**: Create, edit, verify in tables
- **Drivers**: Create, edit, verify in tables
- **Fruit Types**: Create, edit, verify in tables (CAFÉ, CACAO, etc.)

### ✅ Reception Creation
- **Basic Receptions**: Create with all entity relationships
- **Quality Data**: Input violetas, humedad, moho measurements
- **Discount Calculations**: Automatic weight adjustments based on quality
- **Verification**: Confirm correct discount application

### ✅ Quality & Pricing System
- **CAFÉ Quality Thresholds**:
  - Violetas: 0-5% (0%), 5-10% (2%), 10-20% (5%)
  - Humedad: 0-10% (0%), 10-15% (2%), 15-25% (5%), 25%+ (10%)
  - Moho: 0-3% (0%), 3-5% (3%), 5-10% (8%)
- **Automatic Calculations**: Server-side discount application
- **Weight Adjustments**: Final weight = original - discounts

### ✅ Cacao Processing Module
- **Lab Samples**: Generate samples from cacao receptions
- **Quality Measurements**: Input dried sample results
- **Parent Reception Updates**: Lab data propagates to main reception
- **Workflow Testing**: Complete drying and analysis cycle

### ✅ End-to-End Workflows
- **Complete Workflow**: Entities → Reception → Quality → Discounts
- **Data Integrity**: Verify all relationships and calculations
- **UI Verification**: Confirm data appears correctly in tables/forms

## Quality Discount Examples

### CAFÉ Reception (500kg) with Quality Issues:
- **Violetas**: 12% → 5% discount → 25kg deduction
- **Humedad**: 18% → 5% discount → 25kg deduction
- **Moho**: 7% → 8% discount → 35kg deduction
- **Total Discount**: 85kg (17% of original weight)
- **Final Weight**: 415kg

### Perfect Quality CAFÉ (500kg):
- All metrics < threshold → 0% discount
- **Final Weight**: 500kg (no deductions)

## Running Tests

### Prerequisites
1. Development server running: `npm run dev`
2. Database migrations applied
3. Admin user exists (username: admin, password: admin123)

### Individual Test Execution
```bash
# Run specific test suite
npm run test:entity-crud

# Run with timeout (prevents hanging)
timeout 120s npm run test:e2e-complete
```

### Test Results
Each test provides:
- ✅ **Pass/Fail Status**: Clear success/failure indicators
- 📊 **Test Summary**: Passed/failed/total counts
- 🎯 **Detailed Logging**: Step-by-step execution feedback
- ⚠️ **Warnings**: Non-critical issues (e.g., UI elements not visible)

## Test Data

Tests create unique test data using timestamps to avoid conflicts:
- Associations: `ASOC{timestamp}`
- Providers: `PROV{timestamp}`
- Drivers: `LIC{timestamp}`
- Receptions: `E2E{timestamp}`

## Troubleshooting

### Common Issues

1. **Browser Timeout**: Tests may hang on slow systems
   ```bash
   timeout 120s npm run test:e2e-complete
   ```

2. **Association Selection**: Radix UI Select components may not work with standard Playwright methods
   - Tests skip association selection if complex
   - Manual testing recommended for association workflows

3. **Database State**: Tests assume clean database state
   - Run migrations before testing
   - Clear test data between runs if needed

### Debug Mode
Run tests with browser visible for debugging:
```bash
# Edit test file to set headless: false
const browser = await chromium.launch({
  headless: false,  // Change to true for headless
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
```

## Test Maintenance

### Adding New Tests
1. Follow existing patterns in `tests/automated/`
2. Use timestamp-based unique identifiers
3. Include proper error handling and logging
4. Add npm script to `package.json`

### Updating Test Data
- Modify test constants for different scenarios
- Update expected calculations when discount rules change
- Verify UI selectors haven't changed

## Integration with CI/CD

Tests can be integrated into CI/CD pipelines:
```yaml
# Example GitHub Actions
- name: Run Test Suite
  run: |
    npm run dev &
    sleep 10
    npm run test:e2e-complete
```

## Performance Considerations

- Tests run with `headless: true` by default for CI compatibility
- Individual tests timeout after 2 minutes
- Browser instances are properly closed after each test
- Database connections are handled by the application

---

**Test Suite Version**: 1.0
**Last Updated**: November 2025
**Coverage**: Entity CRUD, Reception Creation, Quality Evaluation, Discount Calculations, Cacao Processing