import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
    )

    const tournamentId = params.id

    // Check if tournament exists
    const { data: tournament, error: tourneyError } = await supabase
      .from('tournaments')
      .select('id, name, status, ip_revealed')
      .eq('id', tournamentId)
      .single()

    if (tourneyError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Always fetch IPs associated with the tournament
    const { data: ips, error: ipsError } = await supabase
      .from('tournament_server_ips')
      .select('server_ip, server_port')
      .eq('tournament_id', tournamentId)

    if (ipsError) {
      return NextResponse.json({ error: 'Failed to fetch IPs' }, { status: 500 })
    }

    return NextResponse.json({
      tournament_id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      ip_revealed: tournament.ip_revealed,
      servers: ips || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
