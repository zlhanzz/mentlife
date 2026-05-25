#!/usr/bin/env node
/**
 * Google Auth Setup Verifier
 * Jalankan: node scripts/verify-google-auth.js
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

console.log('🔍 Verifying Google Auth Setup...\n');

// Check .env.local
const envPath = path.join(projectRoot, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ File .env.local tidak ditemukan');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && key.trim().startsWith('NEXT_PUBLIC_')) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/"/g, '');
  }
});

console.log('📋 Environment Variables:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'} ${envVars.NEXT_PUBLIC_SUPABASE_URL || '(not set)'}`);
console.log(`   NEXT_PUBLIC_SITE_URL: ${envVars.NEXT_PUBLIC_SITE_URL ? '✅' : '⚠️'} ${envVars.NEXT_PUBLIC_SITE_URL || '(not set)'}`);
console.log('');

// Check if Google Auth actions exist
const actionsPath = path.join(projectRoot, 'src/features/auth/actions.ts');
if (fs.existsSync(actionsPath)) {
  const actionsContent = fs.readFileSync(actionsPath, 'utf8');
  const hasGoogleActions = actionsContent.includes('loginWithGoogleAction') && actionsContent.includes('registerWithGoogleAction');
  console.log(`Google Auth Actions: ${hasGoogleActions ? '✅' : '❌'}`);
} else {
  console.log('Google Auth Actions: ❌');
}

// Check if callback route exists
const callbackPath = path.join(projectRoot, 'src/app/auth/callback/route.ts');
console.log(`OAuth Callback Route: ${fs.existsSync(callbackPath) ? '✅' : '❌'}`);

// Check if login form has Google button
const loginFormPath = path.join(projectRoot, 'src/features/auth/components/login-form.tsx');
if (fs.existsSync(loginFormPath)) {
  const loginFormContent = fs.readFileSync(loginFormPath, 'utf8');
  const hasGoogleButton = loginFormContent.includes('loginWithGoogleAction') || loginFormContent.includes('Continue with Google');
  console.log(`Login Form Google Button: ${hasGoogleButton ? '✅' : '❌'}`);
}

// Check if register form has Google button
const registerFormPath = path.join(projectRoot, 'src/features/auth/components/register-form.tsx');
if (fs.existsSync(registerFormPath)) {
  const registerFormContent = fs.readFileSync(registerFormPath, 'utf8');
  const hasGoogleButton = registerFormContent.includes('registerWithGoogleAction') || registerFormContent.includes('Continue with Google');
  console.log(`Register Form Google Button: ${hasGoogleButton ? '✅' : '❌'}`);
}

console.log('\n📋 Next Steps:');
console.log('   1. Buka Google Cloud Console → APIs & Services → Credentials');
console.log('   2. Buat OAuth 2.0 Client ID');
console.log('   3. Tambahkan authorized origins:');
console.log('      - http://localhost:3000');
console.log('   4. Tambahkan authorized redirect URIs:');
console.log('      - http://localhost:3000/auth/callback');
console.log('   5. Copy Client ID dan Client Secret');
console.log('   6. Buka Supabase Dashboard → Authentication → Providers → Google');
console.log('   7. Paste Client ID dan Client Secret');
console.log('   8. Restart: npm run dev');
console.log('');

console.log('📚 Dokumentasi lengkap: GOOGLE_AUTH_SETUP.md\n');
