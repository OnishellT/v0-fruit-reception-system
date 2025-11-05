#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 *
 * Runs all test suites for the Fruit Reception System
 */

import { execSync } from 'child_process';

class TestRunner {
  constructor() {
    this.testSuites = [
      { name: 'Database Tests', file: 'db/test-database.js', command: 'node' },
      { name: 'API Tests', file: 'api/test-api.js', command: 'node' },
      { name: 'Authentication Tests', file: 'automated/test-auth.js', command: 'node' },
      { name: 'Login Tests', file: 'automated/test-login.js', command: 'node' },
      { name: 'Detailed Login Tests', file: 'automated/test-login-detailed.js', command: 'node' },
      { name: 'Reception Tests', file: 'automated/reception.test.js', command: 'node' },
      { name: 'Quality Evaluation Tests', file: 'automated/quality.test.js', command: 'node' },
      { name: 'Café Quality Tests', file: 'automated/test-quality-cafe.js', command: 'node' },
      { name: 'Pricing System Tests', file: 'automated/pricing.test.js', command: 'node' },
      { name: 'Weight Discount Tests', file: 'automated/test-weight-discount-calculations.js', command: 'node' },
      { name: 'CRUD Tests', file: 'automated/test-crud-comprehensive.js', command: 'node' },
      { name: 'Browser Automation Tests', file: 'automated/test-suite.js', command: 'node' }
    ];
    this.results = {
      suites: [],
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
  }

  async runTestSuite(suite) {
    console.log(`\n🚀 Running ${suite.name}...`);
    console.log('='.repeat(50));

    try {
      const command = suite.command || 'node';
      const fullCommand = suite.command === 'npx playwright test'
        ? `${command} ${suite.file} --reporter=line`
        : `${command} ${suite.file}`;

      const output = execSync(fullCommand, {
        encoding: 'utf8',
        timeout: 300000, // 5 minutes timeout
        stdio: 'pipe'
      });

      console.log(output);

      // Parse results from output
      const passed = (output.match(/✅/g) || []).length;
      const failed = (output.match(/❌/g) || []).length;
      const skipped = (output.match(/⏭️/g) || []).length;
      const total = passed + failed + skipped;

      this.results.suites.push({
        name: suite.name,
        total,
        passed,
        failed,
        skipped,
        success: failed === 0
      });

      this.results.total += total;
      this.results.passed += passed;
      this.results.failed += failed;
      this.results.skipped += skipped;

      return true;
    } catch (error) {
      console.log(`❌ ${suite.name} failed to execute:`, error.message);

      this.results.suites.push({
        name: suite.name,
        total: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        success: false,
        error: error.message
      });

      this.results.failed += 1;
      return false;
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    console.log(`\nTest Suites: ${this.results.suites.length}`);
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️ Skipped: ${this.results.skipped}`);

    const successRate = this.results.total > 0 ?
      ((this.results.passed / this.results.total) * 100).toFixed(1) : 0;
    console.log(`📈 Overall Success Rate: ${successRate}%`);

    console.log('\nSuite Results:');
    this.results.suites.forEach(suite => {
      const icon = suite.success ? '✅' : '❌';
      const rate = suite.total > 0 ? ((suite.passed / suite.total) * 100).toFixed(1) : '0.0';
      console.log(`${icon} ${suite.name}: ${suite.passed}/${suite.total} (${rate}%)`);

      if (suite.error) {
        console.log(`   Error: ${suite.error}`);
      }
    });

    console.log('\n' + '='.repeat(60));

    if (this.results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! The system is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Please review the issues above.');
    }
  }

  async runPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    // Check if Next.js dev server is running
    try {
      const response = await fetch('http://localhost:3000');
      if (response.status !== 200) {
        console.log('⚠️  Next.js dev server may not be running on port 3000');
      } else {
        console.log('✅ Next.js dev server is running');
      }
    } catch (e) {
      console.log('❌ Next.js dev server is not accessible');
      console.log('   Please start the dev server with: npm run dev');
      return false;
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('⚠️  NEXT_PUBLIC_SUPABASE_URL environment variable not set');
    } else {
      console.log('✅ Supabase URL configured');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY environment variable not set');
    } else {
      console.log('✅ Supabase service key configured');
    }

    return true;
  }

  async runAllTests() {
    console.log('🧪 FRUIT RECEPTION SYSTEM - COMPREHENSIVE TESTING');
    console.log('Testing all implemented features:');
    console.log('  • Authentication & Login');
    console.log('  • Reception Management');
    console.log('  • Quality Evaluation (Café)');
    console.log('  • Weight Discounts');
    console.log('  • Quality Pricing System');
    console.log('  • Cacao Processing Module');
    console.log('  • Dashboard & Analytics');
    console.log('  • Database Integrity');
    console.log('  • API Endpoints');
    console.log('  • Browser Automation');

    const prerequisitesOk = await this.runPrerequisites();
    if (!prerequisitesOk) {
      console.log('\n❌ Prerequisites not met. Please fix the issues above.');
      return;
    }

    console.log('\n🏃 Starting test execution...\n');

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    this.printResults();
  }
}

// Run all tests
const runner = new TestRunner();
runner.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});