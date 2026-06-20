import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

// GET /api/plugin/check?ign=PlayerName — Check if player can join
export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const { searchParams } = new URL(request.url)
  const ign = searchParams.get('ign')

  if (!ign) {
    return NextResponse.json({ error: 'Missing ign parameter' }, { status: 400 })
  }

  // Handle organization token checks
  if (result.tokenType === 'organization') {
    const { organization } = result
    const { data: orgMember } = await supabaseAdmin
      .from('organization_members')
      .select('id, minecraft_ign')
      .eq('organization_id', organization.id)
      .ilike('minecraft_ign', ign)
      .maybeSingle()

    if (orgMember) {
      return NextResponse.json({
        allowed: true,
        reason: 'Organization member',
        is_org_member: true,
      })
    }

    return NextResponse.json({
      allowed: false,
      reason: 'You are not a member of this organization.',
    })
  }

  // Handle tournament token checks
  const { tournament } = result

  // 1. Check if player is an org member (always allowed)
  const { data: orgMember } = await supabaseAdmin
    .from('organization_members')
    .select('id, minecraft_ign')
    .eq('organization_id', tournament.organization_id)
    .ilike('minecraft_ign', ign)
    .maybeSingle()

  if (orgMember) {
    return NextResponse.json({
      allowed: true,
      reason: 'Organization member',
      is_org_member: true,
    })
  }

  // Check tournament status
  if (tournament.status === 'SOON') {
    return NextResponse.json({
      allowed: false,
      reason: 'Tournament has not started yet.',
      status: 'SOON',
    })
  }

  if (tournament.status === 'ENDED') {
    return NextResponse.json({
      allowed: false,
      reason: 'Tournament has ended.',
      status: 'ENDED',
    })
  }

  // 2. If whitelist is disabled, only org members can join
  if (!tournament.whitelist_enabled) {
    return NextResponse.json({
      allowed: false,
      reason: 'Whitelist is disabled. Only organization members can join.',
      whitelist_enabled: false,
    })
  }

  // 3. Check whitelist
  const { data: player } = await supabaseAdmin
    .from('tournament_players')
    .select('id, is_banned')
    .eq('tournament_id', tournament.id)
    .ilike('minecraft_ign', ign)
    .maybeSingle()

  if (!player) {
    return NextResponse.json({
      allowed: false,
      reason: 'You are not whitelisted for this tournament.',
    })
  }

  if (player.is_banned) {
    return NextResponse.json({
      allowed: false,
      reason: 'You have been banned from this tournament.',
      is_banned: true,
    })
  }

  return NextResponse.json({
    allowed: true,
    reason: 'Whitelisted player',
    is_whitelisted: true,
  })
}
