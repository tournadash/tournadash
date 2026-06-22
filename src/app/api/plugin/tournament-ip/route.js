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
  const tournamentId = searchParams.get('tournament_id')

  if (!tournamentId) {
    return NextResponse.json({ error: 'Missing tournament_id parameter' }, { status: 400 })
  }

  // Fetch tournament details
  const { data: tournament, error } = await supabaseAdmin
    .from('tournaments')
    .select('id, name, status, organization_id')
    .eq('id', tournamentId)
    .single()

  if (error || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
  }

  // Check if tournament is active (ONGOING)
  if (tournament.status !== 'ONGOING') {
    return NextResponse.json({ error: 'Tournament has not started or is already ended.' }, { status: 403 })
  }

  // Check if user is a member of the organization hosting the tournament
  const { data: member } = await supabaseAdmin
    .from('organization_members')
    .select('id')
    .eq('organization_id', tournament.organization_id)
    .eq('user_id', user.id)
    .maybeSingle()

  let isAllowed = !!member

  if (!isAllowed && user.minecraft_ign) {
    // Check if player is whitelisted and not banned
    const { data: player } = await supabaseAdmin
      .from('tournament_players')
      .select('id, is_banned')
      .eq('tournament_id', tournamentId)
      .ilike('minecraft_ign', user.minecraft_ign)
      .maybeSingle()

    if (player && !player.is_banned) {
      isAllowed = true
    }
  }

  if (!isAllowed) {
    return NextResponse.json({ error: 'You are not selected/whitelisted to join this tournament.' }, { status: 403 })
  }

  // Fetch IP from tournament_server_ips table (not tournaments table)
  const { data: ipRecord } = await supabaseAdmin
    .from('tournament_server_ips')
    .select('server_ip')
    .eq('tournament_id', tournamentId)
    .limit(1)
    .maybeSingle()

  const ip = ipRecord?.server_ip || 'localhost'

  return NextResponse.json({ ip })
}
