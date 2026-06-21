import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// GET /api/plugin/members — Get list of organization members
export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  let orgId = null
  if (result.tokenType === 'tournament') {
    orgId = result.tournament.organization_id
  } else if (result.tokenType === 'organization') {
    orgId = result.organization.id
  }

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID not found' }, { status: 400 })
  }

  const { data: members, error } = await supabaseAdmin
    .from('organization_members')
    .select('id, user_id, role, minecraft_ign, created_at, users(display_name, username, avatar_url)')
    .eq('organization_id', orgId)
    .order('minecraft_ign', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Format response to make it easy for plugins to consume
  const formattedMembers = (members || []).map(m => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    minecraft_ign: m.minecraft_ign,
    username: m.users?.username || null,
    display_name: m.users?.display_name || null,
    avatar_url: m.users?.avatar_url || null,
    created_at: m.created_at
  }))

  return NextResponse.json({
    organization_id: orgId,
    total: formattedMembers.length,
    members: formattedMembers
  })
}
