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
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')

  if (!orgId) {
    return NextResponse.json({ error: 'Missing org_id parameter' }, { status: 400 })
  }

  // Fetch tournaments of the organization that are not ENDED
  const { data: tournaments, error } = await supabaseAdmin
    .from('tournaments')
    .select('id, name, slug, status, starts_at, ends_at, prizepool, player_count, max_players, whitelist_enabled, registration_open, max_registrations')
    .eq('organization_id', orgId)
    .neq('is_private', true)
    .neq('status', 'ENDED')
    .order('starts_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check if user is a member of the organization
  const { data: member } = await supabaseAdmin
    .from('organization_members')
    .select('id, role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle()

  const isMember = !!member

  const tournamentList = []
  for (const t of tournaments) {
    let isSelected = false
    let selectionReason = ''
    let isRegistered = false
    let registrationStatus = null

    // Check registration status
    const { data: reg } = await supabaseAdmin
      .from('tournament_registrations')
      .select('status')
      .eq('tournament_id', t.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (reg) {
      isRegistered = true
      registrationStatus = reg.status
    }

    if (isMember) {
      isSelected = true
      selectionReason = 'Organization member'
    } else {
      // Check if user's IGN is whitelisted and not banned
      if (user.minecraft_ign) {
        const { data: player } = await supabaseAdmin
          .from('tournament_players')
          .select('id, is_banned')
          .eq('tournament_id', t.id)
          .ilike('minecraft_ign', user.minecraft_ign)
          .maybeSingle()

        if (player && !player.is_banned) {
          isSelected = true
          selectionReason = 'Whitelisted player'
        } else if (player && player.is_banned) {
          selectionReason = 'Banned from tournament'
        } else {
          selectionReason = 'Not registered'
        }
      } else {
        selectionReason = 'No Minecraft IGN set'
      }
    }

    const joinEnabled = isSelected && t.status === 'ONGOING'

    // Get registration count
    const { count: regCount } = await supabaseAdmin
      .from('tournament_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', t.id)

    tournamentList.push({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      starts_at: t.starts_at,
      ends_at: t.ends_at,
      prizepool: t.prizepool,
      player_count: t.player_count,
      max_players: t.max_players,
      is_selected: isSelected,
      is_registered: isRegistered,
      registration_status: registrationStatus,
      selection_reason: selectionReason,
      join_enabled: joinEnabled,
      registration_open: t.registration_open || false,
      max_registrations: t.max_registrations || null,
      registration_count: regCount || 0
    })
  }

  return NextResponse.json({ tournaments: tournamentList })
}
