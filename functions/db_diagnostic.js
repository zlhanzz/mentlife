const path = require('path');
const projectNodeModules = 'c:/Users/ZHULL/Documents/MentLife Project/node_modules';
const { createClient } = require(path.join(projectNodeModules, '@supabase/supabase-js'));
const fs = require('fs');

// Read .env.local manually
const envPath = 'c:/Users/ZHULL/Documents/MentLife Project/.env.local';
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error("Failed to read .env.local:", e.message);
  process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables from .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log("--- Supabase Database Diagnostics ---");
  
  // 1. Fetch all users from profiles
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, full_name');
  if (profErr) {
    console.error("Error fetching profiles:", profErr.message);
    return;
  }
  console.log(`Total profiles in 'profiles' table: ${profiles.length}`);

  // 2. Fetch all users from users_core
  const { data: usersCore, error: ucErr } = await supabase.from('users_core').select('id');
  if (ucErr) {
    console.error("Error fetching users_core:", ucErr.message);
  } else {
    console.log(`Total rows in 'users_core' table: ${usersCore.length}`);
  }

  // 3. Fetch all users from financial_profiles
  const { data: finProfiles, error: finErr } = await supabase.from('financial_profiles').select('id');
  if (finErr) {
    console.error("Error fetching financial_profiles:", finErr.message);
  } else {
    console.log(`Total rows in 'financial_profiles' table: ${finProfiles.length}`);
  }

  if (ucErr || finErr) return;

  const profIds = profiles.map(p => p.id);
  const ucIds = new Set(usersCore.map(u => u.id));
  const finIds = new Set(finProfiles.map(f => f.id));

  // Find profiles missing users_core
  const missingUc = profiles.filter(p => !ucIds.has(p.id));
  console.log(`\nProfiles missing 'users_core' row: ${missingUc.length}`);
  missingUc.forEach(p => {
    console.log(`  - ${p.full_name} (ID: ${p.id})`);
  });

  // Find profiles missing financial_profiles
  const missingFin = profiles.filter(p => !finIds.has(p.id));
  console.log(`Profiles missing 'financial_profiles' row: ${missingFin.length}`);
  missingFin.forEach(p => {
    console.log(`  - ${p.full_name} (ID: ${p.id})`);
  });

  // Let's check table columns of users_core to see if career and finance inputs are there
  console.log("\nChecking a sample user's columns in profiles, financial_profiles, and users_core...");
  if (profiles.length > 0) {
    const sampleId = profiles[0].id;
    
    const { data: pSample, error: pSampleErr } = await supabase.from('profiles').select('*').eq('id', sampleId).single();
    const { data: ucSample, error: ucSampleErr } = await supabase.from('users_core').select('*').eq('id', sampleId).single();
    const { data: finSample, error: finSampleErr } = await supabase.from('financial_profiles').select('*').eq('id', sampleId).single();

    if (pSample) {
      console.log("\nSample profiles keys:", Object.keys(pSample));
    }
    if (ucSample) {
      console.log("\nSample users_core keys:", Object.keys(ucSample));
    }
    if (finSample) {
      console.log("\nSample financial_profiles keys:", Object.keys(finSample));
    }
  }
}

diagnose();
