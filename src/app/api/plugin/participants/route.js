import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// GET /api/plugin/participants — Get list of whitelisted tournament players
export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  let tournamentId = null
  if (result.tokenType === 'tournament') {
    tournamentId = result.tournament.id
  } else if (result.tokenType === 'organization') {
    const { searchParams } = new URL(request.url)
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

  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID not found' }, { status: 400 })
  }

  const { data: participants, error } = await supabaseAdmin
    .from('tournament_players')
    .select('id, minecraft_ign, minecraft_uuid, is_banned, added_via, created_at')
    .eq('tournament_id', tournamentId)
    .order('minecraft_ign', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    tournament_id: tournamentId,
    total: participants?.length || 0,
    active: participants?.filter(p => !p.is_banned).length || 0,
    participants: participants || []
  })
}
