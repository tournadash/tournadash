import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name, description, banner_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!tournament) {
    return {
      title: 'Tournament Not Found',
    }
  }

  const title = `${tournament.name}`
  const description = tournament.description || `Register and participate in ${tournament.name} on TournaDash.`
  const imageUrl = tournament.banner_url || '/og-image.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: tournament.name,
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

export default function TournamentDetailLayout({ children }) {
  return <>{children}</>
}
