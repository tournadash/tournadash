import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, bio, avatar_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!org) {
    return {
      title: 'Organization Not Found',
    }
  }

  const title = `${org.name}`
  const description = org.bio || `View the official profile of ${org.name} on TournaDash.`
  const imageUrl = org.avatar_url || '/og-image.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: org.name,
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

export default function OrgPublicProfileLayout({ children }) {
  return <>{children}</>
}
