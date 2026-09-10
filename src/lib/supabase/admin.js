import { createClient } from '@supabase/supabase-js'

// Admin client with service role key - ONLY for API routes
// Uses a lazy proxy to prevent build crashes during module evaluation when SUPABASE_SERVICE_ROLE_KEY is not yet configured

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-service-role-key'

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

let _cachedClient = null

const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    if (!_cachedClient) {
      _cachedClient = getAdminClient()
    }
    const val = _cachedClient[prop]
    if (typeof val === 'function') {
      return val.bind(_cachedClient)
    }
    return val
  }
})

export { supabaseAdmin }
