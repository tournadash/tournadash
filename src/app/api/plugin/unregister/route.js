import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// POST /api/plugin/unregister — Cancel registration from the mod
export async function POST(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  if (result.tokenType !== 'user') {
    return NextResponse.json({ error: 'This endpoint requires a user login key.' }, { status: 403 })
  }

  const { user } = result

  try {
    const body = await request.json()
    const tournamentId = body.tournament_id

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournament_id.' }, { status: 400 })
    }

    // Fetch tournament
    const { data: tournament } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 })
    }

    if (!tournament.registration_open) {
      return NextResponse.json({ error: 'Registration is closed. You cannot cancel registration.' }, { status: 400 })
    }

    // Fetch registration
    const { data: registration } = await supabaseAdmin
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found.' }, { status: 404 })
    }

    const { minecraft_ign, status } = registration

    // Delete registration
    await supabaseAdmin
      .from('tournament_registrations')
      .delete()
      .eq('id', registration.id)

    // Remove from whitelist
    await supabaseAdmin
      .from('tournament_players')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('minecraft_ign', minecraft_ign)

    // Auto-fill promotion if was SELECTED
    if (status === 'SELECTED' && tournament.auto_fill && tournament.auto_select_count) {
      const { data: nextReg } = await supabaseAdmin
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('status', 'REGISTERED')
        .order('registered_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextReg) {
        await supabaseAdmin
          .from('tournament_registrations')
          .update({ status: 'SELECTED' })
          .eq('id', nextReg.id)

        await supabaseAdmin
          .from('tournament_players')
          .insert({
            tournament_id: tournamentId,
            minecraft_ign: nextReg.minecraft_ign,
            added_by: nextReg.user_id,
            added_via: 'mod'
          })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
