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
      
      // Auto-extract Discord identity if present
      const discordIdentity = user.identities?.find(id => id.provider === 'discord')
      if (discordIdentity) {
        const discordId = discordIdentity.id || discordIdentity.identity_data?.provider_id || discordIdentity.identity_data?.sub
        const discordUsername = discordIdentity.identity_data?.custom_claims?.username || discordIdentity.identity_data?.user_name || discordIdentity.identity_data?.name
        
        if (discordId) {
          // Update public.users table with discord_id and update social_discord if empty
          await supabase
            .from('users')
            .update({
              discord_id: discordId,
              social_discord: discordUsername || null
            })
            .eq('id', user.id)
        }
      }

      return response
    }
  }

  // If there's an error, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
