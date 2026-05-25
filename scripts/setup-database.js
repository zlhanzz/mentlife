#!/usr/bin/env node
/**
 * MentLife Database Setup Helper
 * Jalankan: node scripts/setup-database.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scriptDir = __dirname;
const projectRoot = path.join(scriptDir, '..');

console.log('🔧 MentLife Database Setup Helper\n');

// Check if .env.local exists
const envPath = path.join(projectRoot, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ File .env.local tidak ditemukan');
  console.log('\n💡 Silakan buat file .env.local dengan konten:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL="https://lnkpomahqbqugpkmtybg.supabase.co"');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_API_KEY_HERE"');
  process.exit(1);
}

// Check if SQL file exists
const sqlPath = path.join(projectRoot, 'setup-database.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('❌ File setup-database.sql tidak ditemukan');
  process.exit(1);
}

console.log('✅ Environment variables ditemukan');
console.log('✅ SQL migration file ditemukan\n');

console.log('📋 Langkah-langkah setup database:\n');

console.log('1. Buka Supabase Dashboard:');
console.log('   https://supabase.com/dashboard\n');

console.log('2. Pilih project Anda: lnkpomahqbqugpkmtybg\n');

console.log('3. Klik menu "SQL Editor" di kiri\n');

console.log('4. Klik "New Query"\n');

console.log('5. Copy isi file setup-database.sql dan paste ke SQL Editor\n');

console.log('6. Klik "Run"\n');

console.log('7. Verifikasi tabel muncul di "Table Editor":');
console.log('   - profiles');
console.log('   - financial_profiles');
console.log('   - users_core');
console.log('   - tasks');
console.log('   - chat_messages');
console.log('   - ai_memory');
console.log('   - decision_projections');
console.log('   - transactions\n');

console.log('8. Setelah selesai, jalankan aplikasi:');
console.log('   npm run dev\n');

console.log('💡 Tips:');
console.log('   - Jangan lupa login dulu sebelum menjalankan SQL');
console.log('   - Tabel financial_transactions sudah ada (tidak perlu dibuat lagi)');
console.log('   - Jika ada error "relation already exists", abaikan\n');

console.log('📚 Dokumentasi lengkap: SETUP_DATABASE.md\n');

// Ask if user wants to open the SQL file
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Apakah Anda ingin melihat isi SQL file? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\n📄 Isi file setup-database.sql:\n');
    console.log(fs.readFileSync(sqlPath, 'utf8'));
  }
  rl.close();
});
