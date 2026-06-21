import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

export async function POST(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  if (result.tokenType !== 'user') {
    return NextResponse.json({ error: 'This endpoint requires a user login key.' }, { status: 403 })
  }

  const { user } = result
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')

  if (!orgId) {
    return NextResponse.json({ error: 'Missing org_id parameter' }, { status: 400 })
  }

  // Check if organization exists
  const { data: org, error: orgErr } = await supabaseAdmin
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .single()

  if (orgErr || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Check if user is already following the organization
  const { data: existingFollow } = await supabaseAdmin
    .from('user_follows')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (existingFollow) {
    // Unfollow
    const { error: deleteErr } = await supabaseAdmin
      .from('user_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('organization_id', orgId)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    return NextResponse.json({ followed: false, message: `Unfollowed ${org.name}` })
  } else {
    // Follow
    const { error: insertErr } = await supabaseAdmin
      .from('user_follows')
      .insert({
        user_id: user.id,
        organization_id: orgId
      })

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ followed: true, message: `Followed ${org.name}` })
  }
}
