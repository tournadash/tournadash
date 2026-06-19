import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const guildId = searchParams.get('guild_id')
  const discordId = searchParams.get('discord_id')

  if (!guildId || !discordId) {
    return NextResponse.json({ error: 'Missing guild_id or discord_id' }, { status: 400 })
  }

  const botUrl = process.env.DISCORD_BOT_API_URL || 'http://localhost:3001'

  try {
    const res = await fetch(`${botUrl}/api/bot/check-member?guild_id=${guildId}&user_id=${discordId}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // No caching
    })

    if (!res.ok) {
      console.error('Discord bot responded with error code:', res.status)
      return NextResponse.json({ isMember: false, error: 'Discord bot API error' }, { status: 200 })
    }

    const data = await res.json()
    return NextResponse.json({ isMember: !!data.isMember })
  } catch (error) {
    console.error('Error connecting to Discord bot:', error)
    return NextResponse.json({ isMember: false, error: 'Could not reach verification bot server' }, { status: 200 })
  }
}
