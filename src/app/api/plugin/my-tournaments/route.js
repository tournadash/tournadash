import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// GET /api/plugin/my-tournaments — Get tournaments user is registered for or is a team member of
export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  if (result.tokenType !== 'user') {
    return NextResponse.json({ error: 'This endpoint requires a user login key.' }, { status: 403 })
  }

  const { user } = result

  try {
    // 1. Get tournaments user is registered for (not ended)
    const { data: registrations } = await supabaseAdmin
      .from('tournament_registrations')
      .select('tournament_id, status, minecraft_ign, tournaments(id, name, slug, status, organization_id, organizations(name, slug))')
      .eq('user_id', user.id)

    const registeredTournaments = (registrations || [])
      .filter(r => r.tournaments && r.tournaments.status !== 'ENDED')
      .map(r => ({
        id: r.tournaments.id,
        name: r.tournaments.name,
        slug: r.tournaments.slug,
        status: r.tournaments.status,
        registration_status: r.status,
        minecraft_ign: r.minecraft_ign,
        org_name: r.tournaments.organizations?.name || 'Unknown',
        org_slug: r.tournaments.organizations?.slug || '',
        source: 'registered'
      }))

    // 2. Get tournaments where user is an org member (not ended)
    const { data: memberships } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)

    let memberTournaments = []
    if (memberships && memberships.length > 0) {
      const orgIds = memberships.map(m => m.organization_id)
      const { data: orgTournaments } = await supabaseAdmin
        .from('tournaments')
        .select('id, name, slug, status, organization_id, organizations(name, slug)')
        .in('organization_id', orgIds)
        .neq('status', 'ENDED')

      memberTournaments = (orgTournaments || []).map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        registration_status: 'MEMBER',
        minecraft_ign: user.minecraft_ign,
        org_name: t.organizations?.name || 'Unknown',
        org_slug: t.organizations?.slug || '',
        source: 'member'
      }))
    }

    // Deduplicate (member takes priority over registered)
    const memberIds = new Set(memberTournaments.map(t => t.id))
    const filtered = registeredTournaments.filter(t => !memberIds.has(t.id))

    return NextResponse.json({
      tournaments: [...memberTournaments, ...filtered]
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
