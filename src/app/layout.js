import { Outfit, Inter } from 'next/font/google'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import './globals.css'

const outfit = Outfit({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'TournaDash — Minecraft Tournament Platform',
    template: '%s | TournaDash',
  },
  description: 'The ultimate tournament management platform for Minecraft. Organize events with automated whitelisting, live leaderboards, and plugin integration.',
  alternates: {
    canonical: 'https://tournadash.vercel.app',
  },
  keywords: [
    'minecraft tournaments',
    'minecraft tournament platform',
    'minecraft esports',
    'minecraft tournament list',
    'minecraft whitelist manager',
    'minecraft tournament organizer',
    'minecraft server tournaments',
    'minecraft competition',
  ],
  authors: [{ name: 'TournaDash' }],
  creator: 'TournaDash',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tournadash.com',
    siteName: 'TournaDash',
    title: 'TournaDash — Minecraft Tournament Platform',
    description: 'The ultimate tournament management platform for the Minecraft community.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TournaDash - Minecraft Tournament Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TournaDash — Minecraft Tournament Platform',
    description: 'The ultimate tournament management platform for the Minecraft community.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <Navbar />
        <main style={{ paddingTop: 'var(--nav-height)' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
