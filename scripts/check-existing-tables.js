#!/usr/bin/env node
/**
 * Check existing tables in Supabase
 * Jalankan: node scripts/check-existing-tables.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Environment variables tidak ditemukan');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const expectedTables = [
  'profiles',
  'financial_profiles',
  'users_core',
  'financial_transactions',
  'tasks',
  'chat_messages',
  'ai_memory',
  'decision_projections',
  'transactions',
];

async function checkTables() {
  console.log('📋 Checking existing tables in Supabase...\n');

  const { data: tables, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Error checking tables:', error.message);
    console.log('\n💡 Pastikan Anda sudah login dan memiliki akses ke tabel.');
    console.log('   Jalankan: npm run dev → Login → Cek dashboard');
    process.exit(1);
  }

  console.log('✅ Koneksi berhasil!\n');
  console.log('📋 Daftar tabel yang tersedia di database Anda:\n');

  // Cek satu per satu tabel
  for (const table of expectedTables) {
    const { error } = await supabase.from(table).select('count()', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`❌ ${table}: BELUM DIBUAT`);
      } else if (error.message.includes('permission denied')) {
        console.log(`⚠️  ${table}: Ada (RLS memblokir akses)`);
      } else {
        console.log(`⚠️  ${table}: ${error.message}`);
      }
    } else {
      console.log(`✅ ${table}: Ada`);
    }
  }

  console.log('\n💡 Jika tabel belum ada, jalankan SQL migration di:');
  console.log('   Supabase Dashboard → SQL Editor → Copy isi supabase-migration.sql');
}

checkTables();
