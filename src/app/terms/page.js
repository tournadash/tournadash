'use client'

import { useEffect } from 'react'
import Card from '@/components/ui/Card'
import ScrollAnimationInit from '@/components/ui/ScrollAnimationInit'

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service | TournaDash'
  }, [])

  return (
    <div id="terms-page" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 12, 21, 0.45) 0%, rgba(9, 12, 21, 1) 100%), url('/minecraft_castle_bg.png')`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            📋 Terms of Service
          </h1>
          <p className="page-header-banner-desc">
            Please read these terms carefully before accessing or using the TournaDash network.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px' }}>
        <Card className="p-8 animate-on-scroll" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.8' }}>
          <h2 style={{ color: 'var(--color-text-white)', fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>1. Acceptance of Terms</h2>
          <p style={{ marginBottom: 'var(--space-6)' }}>
            By registering an account, creating organizations, hosting tournaments, or entering whitelist pools on TournaDash, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.
          </p>

          <h2 style={{ color: 'var(--color-text-white)', fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>2. User Responsibilities</h2>
          <p style={{ marginBottom: 'var(--space-6)' }}>
            You are responsible for maintaining the confidentiality of your account credentials, providing accurate Minecraft identifiers (IGNs), and respecting tournament rules set by organizers. Any form of cheating, abusive behavior, or bot manipulation may result in account termination.
          </p>

          <h2 style={{ color: 'var(--color-text-white)', fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>3. Tournament Organization & Rules</h2>
          <p style={{ marginBottom: 'var(--space-6)' }}>
            Tournament organizers are solely responsible for setting rules, moderating comments, selecting/approving registrants, and awarding tournament prizes (if any). TournaDash is not liable for prize disputes or organizer misconduct.
          </p>

          <h2 style={{ color: 'var(--color-text-white)', fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>4. Platform Availability</h2>
          <p style={{ marginBottom: 'var(--space-6)' }}>
            Our services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not guarantee uninterrupted server uptime, plugin connectivity, or data persistence.
          </p>

          <h2 style={{ color: 'var(--color-text-white)', fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>5. Modifying Terms</h2>
          <p style={{ margin: 0 }}>
            We reserve the right to modify these Terms of Service at any time. Your continued use of the platform after updates indicates your acceptance of the revised terms.
          </p>
        </Card>
      </div>
      <ScrollAnimationInit />
    </div>
  )
}
