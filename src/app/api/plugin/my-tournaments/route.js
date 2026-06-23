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
      .select('tournament_id, status, minecraft_ign, tournaments(id, name, slug, status, organization_id, registration_open, max_registrations, organizations(name, slug))')
      .eq('user_id', user.id)

    const registeredTournaments = []
    for (const r of (registrations || [])) {
      if (!r.tournaments || r.tournaments.status === 'ENDED') continue

      const { count: regCount } = await supabaseAdmin
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', r.tournaments.id)

      // Check membership
      const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('organization_id', r.tournaments.organization_id)
        .eq('user_id', user.id)
        .maybeSingle()

      // Check whitelist
      let whitelisted = null
      if (user.minecraft_ign) {
        const { data: wl } = await supabaseAdmin
          .from('tournament_players')
          .select('id, is_banned')
          .eq('tournament_id', r.tournaments.id)
          .ilike('minecraft_ign', user.minecraft_ign)
          .maybeSingle()
        whitelisted = wl
      }

      const isSelected = !!member || (!!whitelisted && !whitelisted.is_banned)
      const joinEnabled = isSelected && (!!member || r.tournaments.status === 'ONGOING')

      registeredTournaments.push({
        id: r.tournaments.id,
        name: r.tournaments.name,
        slug: r.tournaments.slug,
        status: r.tournaments.status,
        registration_status: r.status,
        minecraft_ign: r.minecraft_ign,
        org_name: r.tournaments.organizations?.name || 'Unknown',
        org_slug: r.tournaments.organizations?.slug || '',
        registration_open: r.tournaments.registration_open || false,
        max_registrations: r.tournaments.max_registrations || null,
        registration_count: regCount || 0,
        is_registered: true,
        is_selected: isSelected,
        join_enabled: joinEnabled,
        source: 'registered'
      })
    }

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
        .select('id, name, slug, status, organization_id, registration_open, max_registrations, organizations(name, slug)')
        .in('organization_id', orgIds)
        .neq('status', 'ENDED')

      for (const t of (orgTournaments || [])) {
        const { count: regCount } = await supabaseAdmin
          .from('tournament_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', t.id)

        // Check if user is registered
        const { data: reg } = await supabaseAdmin
          .from('tournament_registrations')
          .select('status')
          .eq('tournament_id', t.id)
          .eq('user_id', user.id)
          .maybeSingle()

        const isRegistered = !!reg
        const registrationStatus = reg?.status || 'MEMBER'

        memberTournaments.push({
          id: t.id,
          name: t.name,
          slug: t.slug,
          status: t.status,
          registration_status: registrationStatus,
          minecraft_ign: user.minecraft_ign,
          org_name: t.organizations?.name || 'Unknown',
          org_slug: t.organizations?.slug || '',
          registration_open: t.registration_open || false,
          max_registrations: t.max_registrations || null,
          registration_count: regCount || 0,
          is_registered: isRegistered,
          is_selected: true,
          join_enabled: true,
          source: 'member'
        })
      }
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
