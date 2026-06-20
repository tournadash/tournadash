'use client'

import { useEffect } from 'react'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export default function GettingStartedPage() {
  useEffect(() => {
    document.title = 'Getting Started | TournaDash'
  }, [])

  return (
    <div id="getting-started-page" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 12, 21, 0.45) 0%, rgba(9, 12, 21, 1) 100%), url('/minecraft_leaderboard_bg.png')`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            🚀 Getting Started Guide
          </h1>
          <p className="page-header-banner-desc">
            Learn how to set up your profile, create organizations, configure tournaments, and sync whitelists.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="flex flex-col gap-8">
          
          {/* For Organizers */}
          <Card className="p-6" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)', marginBottom: 'var(--space-3)' }}>
              🏰 For Tournament Organizers
            </h2>
            <div className="flex flex-col gap-4" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
              <div>
                <strong style={{ color: 'var(--color-text-white)' }}>1. Register Your Account:</strong>
                {' '}Create your user login and navigate to the Dashboard to set up your personal account profile.
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-white)' }}>2. Create an Organization:</strong>
                {' '}Head over to <Link href="/dashboard" style={{ color: 'var(--color-primary)' }}>Dashboard</Link> and click the **Create Organization** button. Set your brand name, description, avatar, and banner.
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-white)' }}>3. Invite Team Members:</strong>
                {' '}Add co-owners, managers, and staff to your organization under the **Team Members** settings tab. Collaborate securely.
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-white)' }}>4. Create your first Tournament:</strong>
                {' '}Fill out name, slug, start dates, rules, registration limits, and whitelist requirements.
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-white)' }}>5. Sync with Minecraft:</strong>
                {' '}Install our <Link href="/plugin" style={{ color: 'var(--color-primary)' }}>Minecraft Plugin</Link>, enter your server whitelist token, and players will be whitelisted automatically on registration approval.
              </div>
            </div>
          </Card>

          {/* For Competitors */}
          <Card className="p-6" style={{ borderLeft: '4px solid var(--color-info)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)', marginBottom: 'var(--space-3)' }}>
              ⚔️ For Competitors & Players
            </h2>
            <div className="flex flex-col gap-4" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
              <div>
                <strong style={{ color: 'var(--color-text-white)' }}>1. Complete your profile:</strong>
                {' '}Navigate to your <Link href="/dashboard/profile" style={{ color: 'var(--color-primary)' }}>Profile Edit page</Link> and fill in your **Minecraft In-Game Name (IGN)** exactly as it is spelled. This is crucial for whitelisting.
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-white)' }}>2. Link Discord Account:</strong>
                {' '}Many tournaments require server verification. Link your Discord account in one click under your Profile settings.
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-white)' }}>3. Browse and Register:</strong>
                {' '}Go to <Link href="/tournaments" style={{ color: 'var(--color-primary)' }}>Tournaments</Link>, choose an event, and click **Register**. Double check all requirements.
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-white)' }}>4. Wait for Approval:</strong>
                {' '}Once approved by tournament managers, you will be whitelisted on the Minecraft game server instantly.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
