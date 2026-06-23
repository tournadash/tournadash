import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request, { params }) {
  try {
    const resolvedParams = await params
    const tournamentId = resolvedParams.id

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch tournament details
    const { data: tournament, error: tError } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (!tournament.registration_open) {
      return NextResponse.json({ error: 'Registration is closed. You cannot cancel registration.' }, { status: 400 })
    }

    // 2. Fetch the registration record
    const { data: registration, error: regError } = await supabaseAdmin
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const { minecraft_ign, status } = registration

    // 3. Delete registration record via Admin
    const { error: deleteRegError } = await supabaseAdmin
      .from('tournament_registrations')
      .delete()
      .eq('id', registration.id)

    if (deleteRegError) {
      return NextResponse.json({ error: deleteRegError.message }, { status: 500 })
    }

    // 4. Remove player from whitelist (tournament_players)
    const { error: deletePlayerError } = await supabaseAdmin
      .from('tournament_players')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('minecraft_ign', minecraft_ign)

    if (deletePlayerError) {
      console.error('Failed to remove player from whitelist on withdraw:', deletePlayerError.message)
    }

    // 5. If this registration was SELECTED, and auto_fill is enabled, promote the next registered player
    if (status === 'SELECTED' && tournament.auto_fill && tournament.auto_select_count) {
      // Find the next chronologically registered user for this tournament
      const { data: nextReg, error: nextRegError } = await supabaseAdmin
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('status', 'REGISTERED')
        .order('registered_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextReg && !nextRegError) {
        // Promote next user
        const { error: updateNextError } = await supabaseAdmin
          .from('tournament_registrations')
          .update({ status: 'SELECTED' })
          .eq('id', nextReg.id)

        if (!updateNextError) {
          // Whitelist the promoted player
          const { error: wlNextError } = await supabaseAdmin
            .from('tournament_players')
            .insert({
              tournament_id: tournamentId,
              minecraft_ign: nextReg.minecraft_ign,
              added_by: nextReg.user_id,
              added_via: 'web'
            })

          if (wlNextError) {
            console.error('Failed to auto-whitelist promoted player:', wlNextError.message)
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unregistration API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
