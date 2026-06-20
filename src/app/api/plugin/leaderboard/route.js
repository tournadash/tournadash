import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// GET /api/plugin/leaderboard — Retrieve all custom leaderboards and entries
export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

  let tournamentId = null
  if (result.tokenType === 'tournament') {
    tournamentId = result.tournament.id
  } else if (result.tokenType === 'organization') {
    const { searchParams } = new URL(request.url)
    const tournament_id = searchParams.get('tournament_id')
    if (!tournament_id) {
      return NextResponse.json({ error: 'Missing tournament_id parameter for organization token' }, { status: 400 })
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

  const { data: lbs } = await supabaseAdmin
    .from('tournament_leaderboards')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })

  if (!lbs || lbs.length === 0) {
    return NextResponse.json({ tournament_id: tournamentId, leaderboards: [] })
  }

  const lbIds = lbs.map(l => l.id)
  const { data: entries } = await supabaseAdmin
    .from('tournament_leaderboard_entries')
    .select('*')
    .in('leaderboard_id', lbIds)
    .order('position', { ascending: true })

  const response = lbs.map(lb => ({
    id: lb.id,
    name: lb.name,
    is_public: lb.is_public,
    created_at: lb.created_at,
    entries: entries?.filter(e => e.leaderboard_id === lb.id).map(e => ({
      position: e.position,
      username: e.username,
      notes: e.notes
    })) || []
  }))

  return NextResponse.json({
    tournament_id: tournamentId,
    leaderboards: response
  })
}

// POST /api/plugin/leaderboard — Create or update leaderboard and add entries
export async function POST(request) {
  const result = await validateToken(request)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, is_public, entries } = body
  if (!name) {
    return NextResponse.json({ error: 'Missing leaderboard name' }, { status: 400 })
  }
  if (!entries || !Array.isArray(entries)) {
    return NextResponse.json({ error: 'Missing or invalid entries array' }, { status: 400 })
  }

  let tournamentId = null
  if (result.tokenType === 'tournament') {
    tournamentId = result.tournament.id
  } else if (result.tokenType === 'organization') {
    const { tournament_id } = body
    if (!tournament_id) {
      return NextResponse.json({ error: 'Missing tournament_id in body for organization token' }, { status: 400 })
    }
    // Verify tournament belongs to this organization
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

  // 1. Check if leaderboard name already exists for this tournament
  let { data: lb } = await supabaseAdmin
    .from('tournament_leaderboards')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('name', name)
    .maybeSingle()

  if (lb) {
    // Update existing leaderboard's is_public if provided
    if (is_public !== undefined) {
      const { error: updateError } = await supabaseAdmin
        .from('tournament_leaderboards')
        .update({ is_public: !!is_public })
        .eq('id', lb.id)
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    // Delete existing entries to overwrite them
    const { error: deleteError } = await supabaseAdmin
      .from('tournament_leaderboard_entries')
      .delete()
      .eq('leaderboard_id', lb.id)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  } else {
    // Create new leaderboard
    const { data: newLb, error: insertError } = await supabaseAdmin
      .from('tournament_leaderboards')
      .insert({
        tournament_id: tournamentId,
        name: name,
        is_public: is_public !== undefined ? !!is_public : true
      })
      .select()
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    lb = newLb
  }

  // 2. Insert new entries
  if (entries.length > 0) {
    const insertPayload = entries.map(entry => {
      if (entry.position === undefined || !entry.username) {
        throw new Error('Each entry must contain position and username')
      }
      return {
        leaderboard_id: lb.id,
        position: parseInt(entry.position, 10),
        username: entry.username,
        notes: entry.notes ? String(entry.notes) : null
      }
    })

    try {
      const { error: entriesError } = await supabaseAdmin
        .from('tournament_leaderboard_entries')
        .insert(insertPayload)

      if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 })
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
  }

  return NextResponse.json({
    success: true,
    leaderboard_id: lb.id,
    name: lb.name,
    is_public: lb.is_public,
    entries_count: entries.length
  }, { status: 201 })
}

// DELETE /api/plugin/leaderboard — Delete a leaderboard and its entries
export async function DELETE(request) {
  const result = await validateToken(request)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  if (!name) {
    return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 })
  }

  let tournamentId = null
  if (result.tokenType === 'tournament') {
    tournamentId = result.tournament.id
  } else if (result.tokenType === 'organization') {
    const tournament_id = searchParams.get('tournament_id')
    if (!tournament_id) {
      return NextResponse.json({ error: 'Missing tournament_id parameter for organization token' }, { status: 400 })
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

  const { data: deleted, error } = await supabaseAdmin
    .from('tournament_leaderboards')
    .delete()
    .eq('tournament_id', tournamentId)
    .eq('name', name)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: 'Leaderboard not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, message: `Leaderboard '${name}' deleted successfully` })
}
