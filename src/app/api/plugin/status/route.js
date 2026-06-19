import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// GET /api/plugin/status — Get tournament status
export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

  const { tournament } = result
  return NextResponse.json({
    status: tournament.status,
    whitelist_enabled: tournament.whitelist_enabled,
    player_count: tournament.player_count,
    name: tournament.name,
  })
}

// POST /api/plugin/status — Update tournament status or whitelist toggle
export async function POST(request) {
  const result = await validateToken(request)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status })

  const body = await request.json()
  const updates = {}

  if (body.status && ['SOON', 'ONGOING', 'ENDED'].includes(body.status.toUpperCase())) {
    updates.status = body.status.toUpperCase()
  }

  if (typeof body.whitelist_enabled === 'boolean') {
    updates.whitelist_enabled = body.whitelist_enabled
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update. Use status or whitelist_enabled.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('tournaments')
    .update(updates)
    .eq('id', result.tournament.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    updated: updates,
  })
}
