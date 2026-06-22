import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// POST /api/plugin/verify — Verify server token and return tournament info
export async function POST(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  if (result.tokenType === 'organization') {
    const { organization } = result
    return NextResponse.json({
      valid: true,
      tokenType: 'organization',
      organization: {
        id: organization.id,
        name: organization.name,
      },
    })
  }

  if (result.tokenType === 'user') {
    const { user } = result

    // Check IGN match if provided (from mod login)
    const { searchParams } = new URL(request.url)
    const requestedIgn = searchParams.get('ign')
    if (requestedIgn && user.minecraft_ign) {
      if (requestedIgn.toLowerCase() !== user.minecraft_ign.toLowerCase()) {
        return NextResponse.json({
          error: 'IGN mismatch. Your in-game name ("' + requestedIgn + '") does not match your TournaDash account IGN ("' + user.minecraft_ign + '"). Please launch Minecraft with the correct account.'
        }, { status: 403 })
      }
    }

    return NextResponse.json({
      valid: true,
      tokenType: 'user',
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        minecraft_ign: user.minecraft_ign,
        minecraft_uuid: user.minecraft_uuid,
      },
    })
  }

  const { tournament } = result

  return NextResponse.json({
    valid: true,
    tokenType: 'tournament',
    tournament: {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      whitelist_enabled: tournament.whitelist_enabled,
      player_count: tournament.player_count,
      organization: tournament.organizations?.name,
    },
  })
}
