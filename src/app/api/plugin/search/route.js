import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateToken } from '../utils'

export async function GET(request) {
  const result = await validateToken(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  if (result.tokenType !== 'user') {
    return NextResponse.json({ error: 'This endpoint requires a user login key.' }, { status: 403 })
  }

  const { user } = result
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'organization' or 'tournament'
  const query = searchParams.get('query') || ''

  if (type === 'organization') {
    // Search organizations
    const { data: orgs, error } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug, bio, avatar_url, follower_count')
      .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
      .order('follower_count', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Determine followed status for each org
    const orgIds = orgs.map(o => o.id)
    let followedIds = new Set()
    if (orgIds.length > 0) {
      const { data: follows } = await supabaseAdmin
        .from('user_follows')
        .select('organization_id')
        .eq('user_id', user.id)
        .in('organization_id', orgIds)
      
      if (follows) {
        followedIds = new Set(follows.map(f => f.organization_id))
      }
    }

    const orgsWithFollow = orgs.map(o => ({
      ...o,
      is_following: followedIds.has(o.id)
    }))

    return NextResponse.json({ results: orgsWithFollow })

  } else if (type === 'tournament') {
    // Search tournaments that are not ENDED
    const { data: tournaments, error } = await supabaseAdmin
      .from('tournaments')
      .select('id, name, slug, status, starts_at, ends_at, prizepool, player_count, max_players, organizations(id, name, slug)')
      .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
      .neq('is_private', true)
      .neq('status', 'ENDED')
      .order('starts_at', { ascending: true })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // For each tournament, check if player is whitelisted or a member of the organization
    const results = []
    for (const t of tournaments) {
      // Check registration status
      const { data: reg } = await supabaseAdmin
        .from('tournament_registrations')
        .select('status')
        .eq('tournament_id', t.id)
        .eq('user_id', user.id)
        .maybeSingle()

      const isRegistered = !!reg
      const registrationStatus = reg?.status || null

      // Check membership
      const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('organization_id', t.organizations.id)
        .eq('user_id', user.id)
        .maybeSingle()

      // Check whitelist
      const { data: whitelisted } = await supabaseAdmin
        .from('tournament_players')
        .select('id, is_banned')
        .eq('tournament_id', t.id)
        .ilike('minecraft_ign', user.minecraft_ign)
        .maybeSingle()

      const isSelected = !!member || (!!whitelisted && !whitelisted.is_banned)
      const joinEnabled = isSelected && t.status === 'ONGOING'

      results.push({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        starts_at: t.starts_at,
        ends_at: t.ends_at,
        prizepool: t.prizepool,
        player_count: t.player_count,
        max_players: t.max_players,
        org_name: t.organizations.name,
        org_slug: t.organizations.slug,
        is_selected: isSelected,
        is_registered: isRegistered,
        registration_status: registrationStatus,
        join_enabled: joinEnabled
      })
    }

    return NextResponse.json({ results })

  } else {
    return NextResponse.json({ error: "Invalid search type. Use 'organization' or 'tournament'." }, { status: 400 })
  }
}
