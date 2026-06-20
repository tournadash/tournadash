'use client'

import { useEffect } from 'react'
import Card from '@/components/ui/Card'

export default function HelpPage() {
  useEffect(() => {
    document.title = 'Help Center & FAQ | TournaDash'
  }, [])

  const faqs = [
    {
      q: 'Why am I not being whitelisted in-game after registering?',
      a: 'Please check that your Minecraft In-Game Name (IGN) is entered exactly as spelled (case-sensitive) in your TournaDash Profile. Also, ensure your registration status shows "Whitelisted" or "Approved" rather than "Pending Review".'
    },
    {
      q: 'How does Discord verification work during registration?',
      a: 'Organizers can require players to be in their Discord server before registering. You must link your Discord in your TournaDash Profile, join the organizer\'s Discord server, and click "Verify Membership" in the registration popup.'
    },
    {
      q: 'How do I add co-owners or managers to my organization?',
      a: 'Go to your Dashboard, select your Organization, and navigate to the "Team Members" tab. You can invite other users by their email or username and assign them roles like Owner, Manager, or Staff.'
    },
    {
      q: 'Can I withdraw my registration from a tournament?',
      a: 'Yes, if the registration is still open or pending, you can navigate to the tournament page and click the "Withdraw Registration" button inside the sidebar widget.'
    },
    {
      q: 'How do I generate a Minecraft Server Whitelist Token?',
      a: 'The server whitelist token is automatically generated for every tournament. Go to your Organization Dashboard, click on your tournament, and you will see the Token listed on the details page. Keep this token private.'
    }
  ]

  return (
    <div id="help-page" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 12, 21, 0.45) 0%, rgba(9, 12, 21, 1) 100%), url('/minecraft_arena_bg.png')`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            🙋 Help Center & FAQ
          </h1>
          <p className="page-header-banner-desc">
            Find answers to frequently asked questions or contact our support team.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="flex flex-col gap-6">
          {faqs.map((faq, i) => (
            <Card key={i} className="p-6">
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: '600', color: 'var(--color-text-white)', marginBottom: 'var(--space-2)' }}>
                ❓ {faq.q}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', margin: 0 }}>
                {faq.a}
              </p>
            </Card>
          ))}

          {/* Contact Support */}
          <Card className="p-8 text-center" style={{ marginTop: 'var(--space-6)', borderTop: '4px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '700', color: 'var(--color-text-white)', marginBottom: 'var(--space-2)' }}>
              Still need help?
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              Get in touch with our team directly via email or our Discord community.
            </p>
            <div className="flex justify-center gap-4">
              <a href="mailto:support@tournadash.com" className="btn btn-primary btn-sm">
                Email Support ✉️
              </a>
              <a href="#" className="btn btn-secondary btn-sm">
                Join our Discord
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
