const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const envPath = '.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    env[key] = value
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('Running VaultOP admin features migration...')
  
  // 1. Add columns to tournaments table
  const addColumnsSql = `
    ALTER TABLE tournaments 
      ADD COLUMN IF NOT EXISTS minecraft_version text DEFAULT '1.20.1',
      ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS registration_deadline timestamp with time zone,
      ADD COLUMN IF NOT EXISTS server_connection_ip text,
      ADD COLUMN IF NOT EXISTS participant_broadcast_message text;
  `;
  
  // 2. Add maintenance mode to organizations table
  const orgColumnsSql = `
    ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS maintenance_mode boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS maintenance_reason text;
  `;
  
  // 3. Create bulletins table
  const bulletinsTableSql = `
    CREATE TABLE IF NOT EXISTS organization_bulletins (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
      title text NOT NULL,
      category text NOT NULL,
      content text NOT NULL,
      author_id uuid REFERENCES users(id),
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `;
  
  // Note: we'll use supabase.rpc or a direct query endpoint if available, 
  // but if the user hasn't setup rpc to run arbitrary SQL, we can't easily run DDL commands 
  // via supabase-js without a Postgres connection string.
  
  console.log('SQL to be executed directly in Supabase SQL editor:');
  console.log(addColumnsSql);
  console.log(orgColumnsSql);
  console.log(bulletinsTableSql);
  
}

runMigration();
