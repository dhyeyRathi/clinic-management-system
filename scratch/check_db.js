const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env file
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

async function run() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing environment variables!", env);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("Attempting login as dhyeyrathi7@gmail.com...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'dhyeyrathi7@gmail.com',
    password: 'ManagerPass123!'
  });

  if (authError) {
    console.error("Auth login failed:", authError);
    return;
  }

  console.log("Logged in successfully! User ID:", authData.user.id);
  console.log("User App Metadata:", authData.user.app_metadata);
  console.log("User User Metadata:", authData.user.user_metadata);

  console.log("Fetching profile from public.profiles...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error("Failed to fetch profile:", profileError);
  } else {
    console.log("Profile Data:", profile);
  }
}

run();
