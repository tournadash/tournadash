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
