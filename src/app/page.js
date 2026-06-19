import Link from 'next/link'
import './home.css'

export default function HomePage() {
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
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            🎮 Now in Early Access
          </div>

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
              <div className="hero-stat-value">0+</div>
              <div className="hero-stat-label">🏆 Tournaments</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">0+</div>
              <div className="hero-stat-label">👥 Players</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">0+</div>
              <div className="hero-stat-label">🏰 Organizations</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="features-section" id="features-section">
        <div className="container">
          <div className="section-header">
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
                className="feature-card gaming-glow-hover"
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
          <div className="section-header">
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
            <div className="how-step gaming-glow-hover">
              <div className="how-step-number">1</div>
              <h3 className="how-step-title">Create Your Organization 🏰</h3>
              <p className="how-step-desc">
                Sign up, create your organization profile, and invite your team members with the right roles and permissions.
              </p>
            </div>
            <div className="how-step gaming-glow-hover">
              <div className="how-step-number">2</div>
              <h3 className="how-step-title">Set Up a Tournament 🎮</h3>
              <p className="how-step-desc">
                Configure your event, add a trailer, set registration links, and grab your unique server token for the plugin.
              </p>
            </div>
            <div className="how-step gaming-glow-hover">
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
          <div className="cta-box gaming-glow-hover">
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
    </>
  )
}
