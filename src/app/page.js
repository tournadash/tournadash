import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ScrollAnimationInit from '@/components/ui/ScrollAnimationInit'
import './home.css'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { count: tournamentCount },
    { count: organizationCount },
    { count: playerCount }
  ] = await Promise.all([
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true })
  ])

  const features = [
    {
      icon: '🛡️',
      title: 'Secure Whitelist Management',
      desc: 'Automated whitelist system with real-time sync between your dashboard and Minecraft server. No more manual spreadsheets.',
    },
    {
      icon: '🔌',
      title: 'In-Game Plugin',
      desc: 'Powerful Paper plugin with /tw commands. Add, remove, or ban players directly from your Minecraft console.',
    },
    {
      icon: '⚡',
      title: 'Real-Time Sync',
      desc: 'Changes on your dashboard reflect instantly in-game and vice versa. Powered by Supabase Realtime subscriptions.',
    },
    {
      icon: '👥',
      title: 'Team Management',
      desc: 'Role-based access control with Owner, Manager, and Staff tiers. Collaborate without compromising security.',
    },
    {
      icon: '📺',
      title: 'Live Stream Integration',
      desc: 'Embed YouTube trailers and live streams directly on tournament pages. Keep your audience engaged at every phase.',
    },
    {
      icon: '🏆',
      title: 'Hall of Fame',
      desc: 'Showcase tournament winners with a dedicated podium. Build a lasting legacy for your community.',
    },
  ]

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="hero" id="hero-section">
        {/* Background Effects */}
        <div className="hero-bg">
          <div className="hero-bg-grid" />
        </div>

        {/* Content */}
        <div className="hero-content animate-on-scroll">
          <h1 className="hero-title">
            <span className="hero-title-line">The Ultimate Platform</span>
            <span className="hero-title-line">
              for <span className="text-gradient-primary">Minecraft Tournaments</span>
            </span>
          </h1>

          <p className="hero-description">
            Organize, manage, and automate your Minecraft tournaments with ease. 
            From whitelist management to live streaming — everything your community needs, 
            in one powerful dashboard.
          </p>

          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary btn-lg" id="hero-cta-primary">
              Get Started Free ⚡
            </Link>
            <Link href="/tournaments" className="btn btn-secondary btn-lg" id="hero-cta-secondary">
              Browse Tournaments 🏆
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">{tournamentCount || 0}+</div>
              <div className="hero-stat-label">🏆 Tournaments</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">{playerCount || 0}+</div>
              <div className="hero-stat-label">👥 Players</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">{organizationCount || 0}+</div>
              <div className="hero-stat-label">🏰 Organizations</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="features-section" id="features-section">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <div className="section-label">
              Features
            </div>
            <h2 className="section-title">
              Everything You Need to Run <span className="text-gradient-primary">Epic Tournaments</span> 🛡️
            </h2>
            <p className="section-description">
              From registration to results — TournaDash handles the entire tournament lifecycle so you can focus on creating amazing experiences.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, i) => (
              <div
                key={i}
                className="feature-card gaming-glow-hover animate-on-scroll"
                id={`feature-card-${i}`}
              >
                <div className="feature-icon" style={{ fontSize: '1.5rem' }}>{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="how-section" id="how-section">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <div className="section-label">
              How It Works
            </div>
            <h2 className="section-title">
              Three Steps to Your <span className="text-gradient-primary">First Tournament</span> ⚡
            </h2>
            <p className="section-description">
              Get up and running in minutes, not hours. Our streamlined setup makes tournament management effortless.
            </p>
          </div>

          <div className="how-steps">
            <div className="how-step gaming-glow-hover animate-on-scroll">
              <div className="how-step-number">1</div>
              <h3 className="how-step-title">Create Your Organization 🏰</h3>
              <p className="how-step-desc">
                Sign up, create your organization profile, and invite your team members with the right roles and permissions.
              </p>
            </div>
            <div className="how-step gaming-glow-hover animate-on-scroll">
              <div className="how-step-number">2</div>
              <h3 className="how-step-title">Set Up a Tournament 🎮</h3>
              <p className="how-step-desc">
                Configure your event, add a trailer, set registration links, and grab your unique server token for the plugin.
              </p>
            </div>
            <div className="how-step gaming-glow-hover animate-on-scroll">
              <div className="how-step-number">3</div>
              <h3 className="how-step-title">Go Live & Compete 🏆</h3>
              <p className="how-step-desc">
                Install the plugin, paste your token, and let TournaDash handle the whitelist. Stream live and crown your champions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="cta-section" id="cta-section">
        <div className="container">
          <div className="cta-box gaming-glow-hover animate-on-scroll">
            <h2 className="cta-title">
              Ready to Level Up Your <span className="text-gradient-primary">Tournaments</span>? 🎮
            </h2>
            <p className="cta-desc">
              Join the growing community of Minecraft tournament organizers who trust TournaDash to power their events.
            </p>
            <div className="cta-actions">
              <Link href="/signup" className="btn btn-primary btn-lg" id="cta-signup-btn">
                Create Free Account ⚡
              </Link>
              <Link href="/tournaments" className="btn btn-secondary btn-lg" id="cta-browse-btn">
                Explore Tournaments 🏆
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="faq-section" id="faq-section">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <div className="section-label">FAQ</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-description">
              Find answers to common questions about setting up and managing Minecraft tournaments on TournaDash.
            </p>
          </div>

          <div className="faq-grid">
            <div className="faq-card gaming-glow-hover animate-on-scroll">
              <h3 className="faq-question">What is TournaDash?</h3>
              <p className="faq-answer">
                TournaDash is a dedicated management and automation dashboard for Minecraft tournament organizers. It handles player sign-ups, whitelist syncs, and embeds live streams.
              </p>
            </div>
            <div className="faq-card gaming-glow-hover animate-on-scroll">
              <h3 className="faq-question">How does the whitelist sync work?</h3>
              <p className="faq-answer">
                By installing the TournaDash Minecraft plugin, it automatically syncs whitelisted participants from your web tournament dashboard directly to the game server. It manages joining access based on tournament states.
              </p>
            </div>
            <div className="faq-card gaming-glow-hover animate-on-scroll">
              <h3 className="faq-question">Can I whitelist organization members?</h3>
              <p className="faq-answer">
                Yes! Staff members registered under your organization will be automatically allowed to join the server at any time, even before the tournament officially starts.
              </p>
            </div>
            <div className="faq-card gaming-glow-hover animate-on-scroll">
              <h3 className="faq-question">Is the plugin compatible with my server?</h3>
              <p className="faq-answer">
                Yes, the plugin works with Paper, Purpur, and Spigot servers on versions 1.16.5 up to 1.21+.
              </p>
            </div>
            <div className="faq-card gaming-glow-hover animate-on-scroll">
              <h3 className="faq-question">How do I automate leaderboard updates?</h3>
              <p className="faq-answer">
                You can call the /api/plugin/leaderboard endpoint using your tournament secret token. This allows custom gamemode plugins to automatically submit round rankings and end statuses without manual input.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://tournadash.vercel.app/#organization",
                "name": "TournaDash",
                "url": "https://tournadash.vercel.app",
                "logo": "https://tournadash.vercel.app/favicon.ico",
                "description": "The ultimate tournament management platform for Minecraft. Organize events with automated whitelisting, live leaderboards, and plugin integration.",
                "sameAs": [
                  "https://github.com/tournadash"
                ]
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What is TournaDash?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "TournaDash is a dedicated management and automation dashboard for Minecraft tournament organizers. It handles player sign-ups, whitelist syncs, and embeds live streams."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How does the whitelist sync work?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "By installing the TournaDash Minecraft plugin, it automatically syncs whitelisted participants from your web tournament dashboard directly to the game server. It manages joining access based on tournament states."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Can I whitelist organization members?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes! Staff members registered under your organization will be automatically allowed to join the server at any time, even before the tournament officially starts."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Is the plugin compatible with my server?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, the plugin works with Paper, Purpur, and Spigot servers on versions 1.16.5 up to 1.21+."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How do I automate leaderboard updates?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "You can call the /api/plugin/leaderboard endpoint using your tournament secret token. This allows custom gamemode plugins to automatically submit round rankings and end statuses without manual input."
                    }
                  }
                ]
              }
            ]
          })
        }}
      />

      <ScrollAnimationInit />
    </>
  )
}
