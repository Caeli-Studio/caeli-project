const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://iqimcokjruundhupcfyu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxaW1jb2tqcnV1bmRodXBjZnl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg2MzMzOSwiZXhwIjoyMDc1NDM5MzM5fQ.fsbt9QEhUaf6mXke9ZoAbfhogzceyA3Sd9q4XFtW-v4';

async function testAuth() {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Creating test user...');
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!',
    email_confirm: true,
  });

  if (error) {
    console.error('❌ Error creating user:', error);
    return;
  }

  console.log('✅ User created:', data.user.id);
  console.log('✅ Email:', data.user.email);

  // Supprimer l'utilisateur
  await supabaseAdmin.auth.admin.deleteUser(data.user.id);
  console.log('✅ User deleted');
}

testAuth();
