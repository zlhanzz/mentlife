#!/usr/bin/env node
/**
 * Supabase Connection Test Script
 * Jalankan: node scripts/test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Supabase Connection...\n');

// Validate environment variables
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL tidak ditemukan di .env.local');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan di .env.local');
  process.exit(1);
}

if (supabaseAnonKey.includes('YOUR_') || supabaseAnonKey.includes('EXAMPLE') || supabaseAnonKey.includes('...')) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY masih menggunakan placeholder');
  console.log('\n📝 Cara mendapatkan API key yang valid:');
  console.log('   1. Buka https://supabase.com/dashboard');
  console.log('   2. Pilih project → Settings → API');
  console.log('   3. Copy "anon/public key" (mulai dengan eyJhbG...)');
  console.log('   4. Update file .env.local');
  console.log('   5. Restart: npm run dev');
  process.exit(1);
}

console.log('✅ Environment variables ditemukan');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 10)}\n`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('📡 Testing connection...\n');

  try {
    // Test 1: Check auth status
    console.log('1. Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error(`   ❌ Auth check failed: ${authError.message}`);
    } else {
      console.log(`   ✅ Auth check passed${user ? ` (user: ${user.email})` : ''}`);
    }

    // Test 2: Check database tables
    console.log('\n2. Checking database tables...');
    const tables = [
      'profiles',
      'financial_profiles',
      'users_core',
      'financial_transactions',
      'tasks',
      'chat_messages',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count()', { count: 'exact', head: true });
      if (error) {
        console.error(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: OK`);
      }
    }

    // Test 3: Check RLS policies (if any)
    console.log('\n3. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (policyError) {
      if (policyError.message.includes('permission denied')) {
        console.log('   ⚠️  RLS policies may be blocking access');
        console.log('   ℹ️  Check Supabase Dashboard → Table Editor → profiles → RLS');
      } else {
        console.error(`   ❌ RLS check failed: ${policyError.message}`);
      }
    } else {
      console.log('   ✅ RLS policies: OK');
    }

    console.log('\n✅ All tests passed! Supabase connection is working.');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open http://localhost:3000/dashboard');
    console.log('   3. Check the bottom of the screen for connection status');

  } catch (err) {
    console.error('\n❌ Connection test failed:', err.message);
    process.exit(1);
  }
}

testConnection();
