import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Helper: Validate server token and return tournament
async function validateToken(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 }
  }

  const token = authHeader.split('Bearer ')[1]
  if (!token || !token.startsWith('whitelist_tok_')) {
    return { error: 'Invalid token format', status: 401 }
  }

  const { data: tournament, error } = await supabaseAdmin
    .from('tournaments')
    .select('*, organizations(id, name)')
    .eq('server_token', token)
    .single()

  if (error || !tournament) {
    return { error: 'Invalid server token', status: 401 }
  }

  return { tournament }
}

export { validateToken }
