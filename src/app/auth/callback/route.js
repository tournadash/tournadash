import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  // Create redirect response first
  const response = NextResponse.redirect(`${origin}${redirect}`)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      const user = data.user

      // Check if user exists in public.users
      const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      // Auto-extract Discord identity if present
      const discordIdentity = user.identities?.find(id => id.provider === 'discord')
      let discordId = null
      let discordUsername = null
      let discordAvatar = null
      if (discordIdentity) {
        discordId = discordIdentity.id || discordIdentity.identity_data?.provider_id || discordIdentity.identity_data?.sub
        discordUsername = discordIdentity.identity_data?.custom_claims?.username || discordIdentity.identity_data?.user_name || discordIdentity.identity_data?.name
        discordAvatar = discordIdentity.identity_data?.avatar_url || discordIdentity.identity_data?.image_url || discordIdentity.identity_data?.picture
      }

      if (!publicUser) {
        // Recreate public.users profile row
        const meta = user.user_metadata || {}
        const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Player'
        
        let baseUsername = (meta.preferred_username || meta.username || user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_-]/g, '')
        if (baseUsername.length < 3) baseUsername = 'user_' + baseUsername
        
        let uniqueUsername = baseUsername
        let suffix = 1
        let isUnique = false
        while (!isUnique && suffix < 100) {
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('username', uniqueUsername)
            .maybeSingle()
          if (!existing) {
            isUnique = true
          } else {
            uniqueUsername = `${baseUsername}_${suffix}`
            suffix++
          }
        }

        await supabase
          .from('users')
          .insert({
            id: user.id,
            display_name: fullName,
            username: uniqueUsername,
            avatar_url: meta.avatar_url || meta.picture || discordAvatar || null,
            discord_id: discordId,
            social_discord: discordUsername || null
          })
      } else if (discordId) {
        // Update public.users table with discord_id / social_discord
        // If they linked Discord and don't have an avatar set yet, use their Discord avatar!
        const updatePayload = {
          discord_id: discordId,
          social_discord: discordUsername || null
        }
        if (!publicUser.avatar_url && discordAvatar) {
          updatePayload.avatar_url = discordAvatar
        }
        
        await supabase
          .from('users')
          .update(updatePayload)
          .eq('id', user.id)
      }

      return response
    }
  }

  // If there's an error, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
