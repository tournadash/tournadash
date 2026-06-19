import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('display_name, username, bio, avatar_url')
    .eq('username', username)
    .maybeSingle()

  if (!user) {
    return {
      title: 'User Not Found',
    }
  }

  const displayName = user.display_name || user.username
  const title = `${displayName}`
  const description = user.bio || `View ${displayName}'s profile on TournaDash.`
  const imageUrl = user.avatar_url || '/og-image.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: displayName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default function UserPublicProfileLayout({ children }) {
  return <>{children}</>
}
