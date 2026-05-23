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

async function check() {
  console.log("Checking all users in auth.users...");
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error("Error listing auth users:", authErr.message);
    return;
  }

  console.log(`Total users in auth.users: ${users.length}`);

  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, full_name');
  const { data: usersCore, error: ucErr } = await supabase.from('users_core').select('id');
  const { data: finProfiles, error: finErr } = await supabase.from('financial_profiles').select('id');

  if (profErr || ucErr || finErr) {
    console.error("Error fetching tables:", { profErr, ucErr, finErr });
    return;
  }

  const profileIds = new Set(profiles.map(p => p.id));
  const ucIds = new Set(usersCore.map(u => u.id));
  const finIds = new Set(finProfiles.map(f => f.id));

  console.log("\nInspection Results:");
  users.forEach(user => {
    const email = user.email || 'No email';
    const id = user.id;
    const hasProfile = profileIds.has(id);
    const hasUc = ucIds.has(id);
    const hasFin = finIds.has(id);

    console.log(`User: ${email} (${id})`);
    console.log(`  - Has profile: ${hasProfile ? '✅' : '❌'}`);
    console.log(`  - Has users_core: ${hasUc ? '✅' : '❌'}`);
    console.log(`  - Has financial_profile: ${hasFin ? '✅' : '❌'}`);
  });
}

check();
