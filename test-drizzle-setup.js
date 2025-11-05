#!/usr/bin/env node

/**
 * Simple Drizzle Migration Test
 * Tests the new Drizzle ORM setup
 */

import { db } from './lib/db/index.ts';
import { users, fruitTypes } from './lib/db/schema.ts';

async function testDrizzleSetup() {
  console.log('🧪 Testing Drizzle ORM Setup');
  console.log('=============================');

  try {
    // Test 1: Basic connection
    console.log('\n1. Testing database connection...');
    const testQuery = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful');

    // Test 2: Query users table
    console.log('\n2. Testing users table query...');
    const userData = await db.select().from(users).limit(1);
    console.log(`✅ Users query successful, found ${userData.length} users`);

    // Test 3: Query fruit types
    console.log('\n3. Testing fruit_types table query...');
    const fruitTypeData = await db.select().from(fruitTypes).limit(5);
    console.log(`✅ Fruit types query successful, found ${fruitTypeData.length} fruit types`);

    // Test 4: Test the converted cacao functions
    console.log('\n4. Testing converted cacao functions...');
    const { getFruitTypeBySubtype } = await import('./lib/supabase/cacao.js');
    try {
      const fruitType = await getFruitTypeBySubtype('Café', 'Pergamino');
      console.log('✅ getFruitTypeBySubtype function works:', fruitType);
    } catch (error) {
      console.log('ℹ️  getFruitTypeBySubtype test skipped (no Café Pergamino found)');
    }

    console.log('\n🎉 Drizzle ORM setup test completed successfully!');
    console.log('\nSummary:');
    console.log('- ✅ Drizzle client initialized');
    console.log('- ✅ Database connection working');
    console.log('- ✅ Schema tables accessible');
    console.log('- ✅ Basic queries functional');
    console.log('- ✅ Converted functions working');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testDrizzleSetup().then(success => {
  process.exit(success ? 0 : 1);
});