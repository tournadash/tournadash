import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  if (result.tokenType !== 'user') {
    return NextResponse.json({ error: 'This endpoint requires a user login key.' }, { status: 403 })
  }

  const { user } = result

  const { data: follows, error } = await supabaseAdmin
    .from('user_follows')
    .select('organization_id, organizations(id, name, slug, bio, avatar_url, follower_count)')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const orgs = follows.map(f => f.organizations).filter(Boolean)

  return NextResponse.json({ organizations: orgs })
}
