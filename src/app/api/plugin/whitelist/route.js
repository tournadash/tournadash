import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// GET /api/plugin/whitelist — List all whitelisted players
export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

  const { data: players } = await supabaseAdmin
    .from('tournament_players')
    .select('minecraft_ign, minecraft_uuid, is_banned, added_via, created_at')
    .eq('tournament_id', result.tournament.id)
    .order('minecraft_ign')

  return NextResponse.json({
    tournament: result.tournament.name,
    total: players?.length || 0,
    active: players?.filter(p => !p.is_banned).length || 0,
    players: players || [],
  })
}

// POST /api/plugin/whitelist — Add player to whitelist
export async function POST(request) {
  const result = await validateToken(request)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

  const body = await request.json()
  const { ign, uuid } = body

  if (!ign) {
    return NextResponse.json({ error: 'Missing ign field' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('tournament_players')
    .insert({
      tournament_id: result.tournament.id,
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

  if (ban) {
    // Ban: mark as banned instead of deleting
    const { error } = await supabaseAdmin
      .from('tournament_players')
      .update({ is_banned: true })
      .eq('tournament_id', result.tournament.id)
      .ilike('minecraft_ign', ign)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'banned', ign })
  } else {
    // Remove completely
    const { error } = await supabaseAdmin
      .from('tournament_players')
      .delete()
      .eq('tournament_id', result.tournament.id)
      .ilike('minecraft_ign', ign)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'removed', ign })
  }
}
