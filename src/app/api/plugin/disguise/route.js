import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// GET /api/plugin/disguise?ign=<name> — Fetch disguise IGN for a player
// POST /api/plugin/disguise — Set or toggle disguise IGN
export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const { searchParams } = new URL(request.url)
  const ign = searchParams.get('ign')

  if (!ign) {
    return NextResponse.json({ error: 'Missing ign parameter.' }, { status: 400 })
  }

  // Look up user by minecraft_ign
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, minecraft_ign, disguise_ign')
    .ilike('minecraft_ign', ign)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'Player not found.' }, { status: 404 })
  }

  return NextResponse.json({
    ign: user.minecraft_ign,
    disguise_ign: user.disguise_ign || null,
    has_disguise: !!user.disguise_ign
  })
}

export async function POST(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Accept from server token or user token
  let userId = null
  let playerIgn = null

  if (result.tokenType === 'user') {
    userId = result.user.id
    playerIgn = result.user.minecraft_ign
  } else {
    // Server token: require ign in body
    const body = await request.json()
    playerIgn = body.ign
    if (!playerIgn) {
      return NextResponse.json({ error: 'Missing ign parameter.' }, { status: 400 })
    }
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('minecraft_ign', playerIgn)
      .maybeSingle()
    if (!user) {
      return NextResponse.json({ error: 'Player not found.' }, { status: 404 })
    }
    userId = user.id
  }

  try {
    const body = result.tokenType === 'user' ? await request.json() : {}
    const disguiseName = body.disguise_ign?.trim() || null

    if (disguiseName) {
      // Validate uniqueness: no other user should have this as real or disguise IGN
      const { data: conflictReal } = await supabaseAdmin
        .from('users')
        .select('id')
        .ilike('minecraft_ign', disguiseName)
        .neq('id', userId)
        .maybeSingle()

      if (conflictReal) {
        return NextResponse.json({ error: 'This name is already used as a real IGN by another player.' }, { status: 400 })
      }

      const { data: conflictDisguise } = await supabaseAdmin
        .from('users')
        .select('id')
        .ilike('disguise_ign', disguiseName)
        .neq('id', userId)
        .maybeSingle()

      if (conflictDisguise) {
        return NextResponse.json({ error: 'This name is already used as a disguise IGN by another player.' }, { status: 400 })
      }
    }

    // Update user
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ disguise_ign: disguiseName })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      disguise_ign: disguiseName,
      message: disguiseName ? `Disguise set to "${disguiseName}".` : 'Disguise removed.'
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
