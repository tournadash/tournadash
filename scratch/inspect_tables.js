const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '../.env.local')
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

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspect() {
  const { data: followsData, error: followsError } = await supabase.from('follows').select('*').limit(1)
  console.log('Follows check:', { hasData: !!followsData, error: followsError?.message })

  const { data: uFollowsData, error: uFollowsError } = await supabase.from('user_follows').select('*').limit(1)
  console.log('User follows check:', { hasData: !!uFollowsData, error: uFollowsError?.message })
}

inspect()
