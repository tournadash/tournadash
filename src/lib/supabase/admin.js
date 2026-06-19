import { createClient } from '@supabase/supabase-js'

// Admin client with service role key — ONLY for API routes
// NEVER import this in client components or pages
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export { supabaseAdmin }
