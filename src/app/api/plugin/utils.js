import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Helper: Validate server token and return tournament or organization
async function validateToken(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 }
  }

  const token = authHeader.split('Bearer ')[1]
  if (!token) {
    return { error: 'Invalid token format', status: 401 }
  }

  if (token.startsWith('whitelist_tok_')) {
    const { data: tournament, error } = await supabaseAdmin
      .from('tournaments')
      .select('*, organizations(id, name)')
      .eq('server_token', token)
      .single()

    if (error || !tournament) {
      return { error: 'Invalid server token', status: 401 }
    }

    return { tournament, tokenType: 'tournament' }
  } else if (token.startsWith('org_tok_')) {
    const { data: organization, error } = await supabaseAdmin
      .from('organizations')
      .select('id, name, org_token')
      .eq('org_token', token)
      .single()

    if (error || !organization) {
      return { error: 'Invalid organization token', status: 401 }
    }

    return { organization, tokenType: 'organization' }
  } else {
    return { error: 'Invalid token type prefix', status: 401 }
  }
}

export { validateToken }
