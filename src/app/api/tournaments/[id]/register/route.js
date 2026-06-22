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

    const { ign } = await request.json()
    if (!ign || !ign.trim()) {
      return NextResponse.json({ error: 'Minecraft IGN is required.' }, { status: 400 })
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

    // Check if user is member of tournament's organization
    const { data: memberCheck } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', tournament.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (memberCheck) {
      return NextResponse.json({ error: 'Members of this organization cannot register for its own tournaments.' }, { status: 400 })
    }

    // Check if already registered
    const { data: existingReg } = await supabaseAdmin
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingReg) {
      return NextResponse.json({ error: 'You are already registered for this tournament.' }, { status: 400 })
    }

    // 2. Check max registrations limit
    if (tournament.max_registrations) {
      const { count: currentCount } = await supabaseAdmin
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)

      if (currentCount >= tournament.max_registrations) {
        return NextResponse.json({ error: 'This tournament registration is full.' }, { status: 400 })
      }
    }

    // Fetch user profile info (to get discord_id)
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('discord_id')
      .eq('id', user.id)
      .single()

    // 3. Determine initial status based on auto-select rule
    let initialStatus = 'REGISTERED'
    let shouldWhitelist = false

    if (tournament.auto_select_count) {
      const { count: selectedCount } = await supabaseAdmin
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)
        .eq('status', 'SELECTED')

      if ((selectedCount || 0) < tournament.auto_select_count) {
        initialStatus = 'SELECTED'
        shouldWhitelist = true
      }
    }

    // 4. Insert registration record via Admin
    const { data: registration, error: regError } = await supabaseAdmin
      .from('tournament_registrations')
      .insert({
        tournament_id: tournamentId,
        user_id: user.id,
        minecraft_ign: ign.trim(),
        discord_id: userProfile?.discord_id || null,
        status: initialStatus
      })
      .select()
      .single()

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 })
    }

    // 5. If auto-selected, add to whitelist via Admin
    if (shouldWhitelist) {
      const { error: wlError } = await supabaseAdmin
        .from('tournament_players')
        .insert({
          tournament_id: tournamentId,
          minecraft_ign: ign.trim(),
          added_by: user.id,
          added_via: 'web'
        })

      if (wlError) {
        console.error('Failed to auto-whitelist registered player:', wlError.message)
      }
    }

    return NextResponse.json(registration)
  } catch (error) {
    console.error('Registration API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
