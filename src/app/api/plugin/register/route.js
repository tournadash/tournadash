import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// POST /api/plugin/register — Register for a tournament from the mod
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
    const ign = body.ign || user.minecraft_ign

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournament_id.' }, { status: 400 })
    }
    if (!ign || !ign.trim()) {
      return NextResponse.json({ error: 'Minecraft IGN is required.' }, { status: 400 })
    }

    // Fetch tournament
    const { data: tournament, error: tError } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 })
    }

    if (!tournament.registration_open) {
      return NextResponse.json({ error: 'Registration is closed.' }, { status: 400 })
    }

    // Check org membership
    const { data: memberCheck } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', tournament.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (memberCheck) {
      return NextResponse.json({ error: 'Organization members cannot register for their own tournaments.' }, { status: 400 })
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

    // Check max registrations
    if (tournament.max_registrations) {
      const { count } = await supabaseAdmin
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)

      if (count >= tournament.max_registrations) {
        return NextResponse.json({ error: 'Registration is full.' }, { status: 400 })
      }
    }

    // Determine status
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

    // Insert registration
    const { data: registration, error: regError } = await supabaseAdmin
      .from('tournament_registrations')
      .insert({
        tournament_id: tournamentId,
        user_id: user.id,
        minecraft_ign: ign.trim(),
        status: initialStatus
      })
      .select()
      .single()

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 })
    }

    // Auto-whitelist if needed
    if (shouldWhitelist) {
      await supabaseAdmin
        .from('tournament_players')
        .insert({
          tournament_id: tournamentId,
          minecraft_ign: ign.trim(),
          added_by: user.id,
          added_via: 'mod'
        })
    }

    // Check if registration is now full and needs auto-closing
    if (tournament.max_registrations) {
      const { count: newCount } = await supabaseAdmin
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)

      if (newCount >= tournament.max_registrations) {
        // Automatically close registration
        await supabaseAdmin
          .from('tournaments')
          .update({ registration_open: false })
          .eq('id', tournamentId)

        // Run auto-whitelist promotion since registrations just closed
        await triggerAutoWhitelistOnClose(tournamentId, tournament.auto_select_count)
      }
    }

    return NextResponse.json({ success: true, registration })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Helper to auto-whitelist players when registrations close
async function triggerAutoWhitelistOnClose(tournamentId, autoSelectCount) {
  if (!autoSelectCount || autoSelectCount <= 0) return

  // Count current SELECTED registrations
  const { count: selectedCount } = await supabaseAdmin
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .eq('status', 'SELECTED')

  const needed = autoSelectCount - (selectedCount || 0)
  if (needed <= 0) return

  // Find next oldest REGISTERED players and promote them
  const { data: nextRegs } = await supabaseAdmin
    .from('tournament_registrations')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('status', 'REGISTERED')
    .order('registered_at', { ascending: true })
    .limit(needed)

  if (nextRegs && nextRegs.length > 0) {
    for (const reg of nextRegs) {
      await supabaseAdmin
        .from('tournament_registrations')
        .update({ status: 'SELECTED' })
        .eq('id', reg.id)

      await supabaseAdmin
        .from('tournament_players')
        .insert({
          tournament_id: tournamentId,
          minecraft_ign: reg.minecraft_ign,
          added_by: reg.user_id,
          added_via: 'mod_autowhitelist'
        })
    }
  }
}
