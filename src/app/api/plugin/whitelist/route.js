import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// GET /api/plugin/whitelist — List all whitelisted players and organization members
export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

  let tournamentId = null
  let organizationId = null
  let tournamentName = ''

  if (result.tokenType === 'tournament') {
    tournamentId = result.tournament.id
    organizationId = result.tournament.organization_id
    tournamentName = result.tournament.name
  } else if (result.tokenType === 'organization') {
    const { searchParams } = new URL(request.url)
    const tId = searchParams.get('tournament_id')
    if (!tId) {
      return NextResponse.json({ error: 'Missing tournament_id parameter' }, { status: 400 })
    }
    const { data: tourney } = await supabaseAdmin
      .from('tournaments')
      .select('id, name, organization_id')
      .eq('id', tId)
      .eq('organization_id', result.organization.id)
      .maybeSingle()

    if (!tourney) {
      return NextResponse.json({ error: 'Tournament not found or does not belong to organization' }, { status: 404 })
    }
    tournamentId = tourney.id
    organizationId = tourney.organization_id
    tournamentName = tourney.name
  }

  // Fetch tournament players (participants)
  const { data: players } = await supabaseAdmin
    .from('tournament_players')
    .select('minecraft_ign, minecraft_uuid, is_banned, added_via, created_at')
    .eq('tournament_id', tournamentId)
    .order('minecraft_ign')

  // Fetch organization members
  const { data: orgMembers } = await supabaseAdmin
    .from('organization_members')
    .select('minecraft_ign, role')
    .eq('organization_id', organizationId)
    .not('minecraft_ign', 'is', null)
    .order('minecraft_ign')

  return NextResponse.json({
    tournament: tournamentName,
    total: players?.length || 0,
    active: players?.filter(p => !p.is_banned).length || 0,
    players: players || [],
    organization_members: orgMembers || [],
  })
}

// POST /api/plugin/whitelist — Add player to whitelist
export async function POST(request) {
  const result = await validateToken(request)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ign, uuid } = body
  if (!ign) {
    return NextResponse.json({ error: 'Missing ign field' }, { status: 400 })
  }

  let tournamentId = null
  if (result.tokenType === 'tournament') {
    tournamentId = result.tournament.id
  } else if (result.tokenType === 'organization') {
    const { tournament_id } = body
    if (!tournament_id) {
      return NextResponse.json({ error: 'Missing tournament_id in body for organization token' }, { status: 400 })
    }
    const { data: tourney } = await supabaseAdmin
      .from('tournaments')
      .select('id')
      .eq('id', tournament_id)
      .eq('organization_id', result.organization.id)
      .maybeSingle()

    if (!tourney) {
      return NextResponse.json({ error: 'Tournament not found or does not belong to organization' }, { status: 404 })
    }
    tournamentId = tourney.id
  }

  const { data, error } = await supabaseAdmin
    .from('tournament_players')
    .insert({
      tournament_id: tournamentId,
      minecraft_ign: ign,
      minecraft_uuid: uuid || null,
      added_via: 'plugin',
    })
    .select()
    .single()

  if (error) {
    if (error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Player is already whitelisted' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, player: data }, { status: 201 })
}

// DELETE /api/plugin/whitelist — Remove or ban a player
export async function DELETE(request) {
  const result = await validateToken(request)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

  const { searchParams } = new URL(request.url)
  const ign = searchParams.get('ign')
  const ban = searchParams.get('ban') === 'true'

  if (!ign) {
    return NextResponse.json({ error: 'Missing ign parameter' }, { status: 400 })
  }

  let tournamentId = null
  if (result.tokenType === 'tournament') {
    tournamentId = result.tournament.id
  } else if (result.tokenType === 'organization') {
    const tId = searchParams.get('tournament_id')
    if (!tId) {
      return NextResponse.json({ error: 'Missing tournament_id parameter' }, { status: 400 })
    }
    const { data: tourney } = await supabaseAdmin
      .from('tournaments')
      .select('id')
      .eq('id', tId)
      .eq('organization_id', result.organization.id)
      .maybeSingle()

    if (!tourney) {
      return NextResponse.json({ error: 'Tournament not found or does not belong to organization' }, { status: 404 })
    }
    tournamentId = tourney.id
  }

  if (ban) {
    // Ban: mark as banned instead of deleting
    const { error } = await supabaseAdmin
      .from('tournament_players')
      .update({ is_banned: true })
      .eq('tournament_id', tournamentId)
      .ilike('minecraft_ign', ign)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'banned', ign })
  } else {
    // Remove completely
    const { error } = await supabaseAdmin
      .from('tournament_players')
      .delete()
      .eq('tournament_id', tournamentId)
      .ilike('minecraft_ign', ign)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'removed', ign })
  }
}
