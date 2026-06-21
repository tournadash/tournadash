// Migration script to output SQL for Supabase SQL Editor
function printMigration() {
  console.log('========================================');
  console.log('SQL to run in Supabase SQL Editor:');
  console.log('========================================');
  console.log('');
  console.log('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS minecraft_login_token TEXT UNIQUE;');
  console.log('');
  console.log('========================================');
}

printMigration();
