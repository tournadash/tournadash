'use client'

import { useEffect } from 'react'
import Card from '@/components/ui/Card'

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy | TournaDash'
  }, [])

  return (
    <div id="privacy-page" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 12, 21, 0.45) 0%, rgba(9, 12, 21, 1) 100%), url('/minecraft_castle_bg.png')`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            🔒 Privacy Policy
          </h1>
          <p className="page-header-banner-desc">
            Learn how we collect, store, protect, and use your personal information.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px' }}>
        <Card className="p-8" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.8' }}>
          <h2 style={{ color: 'var(--color-text-white)', fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>1. Information We Collect</h2>
          <p style={{ marginBottom: 'var(--space-6)' }}>
            We collect information you provide directly to us, such as when you create an account, complete your profile details (including your Minecraft In-Game Name and UUID), register for tournaments, or link external authentication providers like Google and Discord.
          </p>

          <h2 style={{ color: 'var(--color-text-white)', fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>2. How We Use Your Information</h2>
          <p style={{ marginBottom: 'var(--space-6)' }}>
            We use the information we collect to manage registrations, automate game server whitelists, verify server requirements (e.g. via Discord server checks), display leaderboard metadata, and improve the TournaDash platform.
          </p>

          <h2 style={{ color: 'var(--color-text-white)', fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>3. Whitelist & Third-Party Sync</h2>
          <p style={{ marginBottom: 'var(--space-6)' }}>
            To automate whitelisting, Minecraft In-Game Names (IGNs) and UUIDs are shared with game servers linked to the tournaments you register for via the TournaDash plugin. By registering for a tournament, you explicitly consent to sharing this info.
          </p>

          <h2 style={{ color: 'var(--color-text-white)', fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>4. Security</h2>
          <p style={{ marginBottom: 'var(--space-6)' }}>
            We employ administrative, technical, and physical measures to safeguard your personal data from unauthorized access, loss, or manipulation. We do not sell user data.
          </p>

          <h2 style={{ color: 'var(--color-text-white)', fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>5. Contact Us</h2>
          <p style={{ margin: 0 }}>
            If you have questions about this Privacy Policy or wish to delete your account data, please visit the Profile Edit page or contact us at <a href="mailto:privacy@tournadash.com" style={{ color: 'var(--color-primary)' }}>privacy@tournadash.com</a>.
          </p>
        </Card>
      </div>
    </div>
  )
}
