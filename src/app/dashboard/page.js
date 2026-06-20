'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Get profile
        let { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (!profileData) {
          // Recreate missing public profile
          const meta = user.user_metadata || {}
          const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Player'
          
          let baseUsername = (meta.preferred_username || meta.username || user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_-]/g, '')
          if (baseUsername.length < 3) baseUsername = 'user_' + baseUsername
          
          let uniqueUsername = baseUsername
          let suffix = 1
          let isUnique = false
          while (!isUnique && suffix < 100) {
            const { data: existing } = await supabase
              .from('users')
              .select('id')
              .eq('username', uniqueUsername)
              .maybeSingle()
            if (!existing) {
              isUnique = true
            } else {
              uniqueUsername = `${baseUsername}_${suffix}`
              suffix++
            }
          }

          const discordIdentity = user.identities?.find(id => id.provider === 'discord')
          let discordId = null
          let discordUsername = null
          if (discordIdentity) {
            discordId = discordIdentity.id || discordIdentity.identity_data?.provider_id || discordIdentity.identity_data?.sub
            discordUsername = discordIdentity.identity_data?.custom_claims?.username || discordIdentity.identity_data?.user_name || discordIdentity.identity_data?.name
          }

          const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              display_name: fullName,
              username: uniqueUsername,
              avatar_url: meta.avatar_url || meta.picture || null,
              discord_id: discordId,
              social_discord: discordUsername || null
            })
            .select()
            .single()

          if (!insertError && inserted) {
            profileData = inserted
          }
        }

        setProfile(profileData)

        // Get orgs
        const { data: memberships } = await supabase
          .from('organization_members')
          .select(`
            role,
            organizations (
              id, name, slug, avatar_url, tournament_count, follower_count
            )
          `)
          .eq('user_id', user.id)

        if (memberships) {
          setOrgs(memberships.map(m => ({
            ...m.organizations,
            role: m.role,
          })))
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="dashboard-page-header">
          <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '300px', height: '18px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className="dashboard-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '140px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    )
  }

  const getRoleVariant = (role) => {
    switch (role) {
      case 'OWNER': return 'primary'
      case 'MANAGER': return 'warning'
      case 'STAFF': return 'info'
      default: return 'neutral'
    }
  }

  return (
    <div id="dashboard-home" className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">
            Welcome back, {profile?.display_name || 'Player'}
          </h1>
          <p className="dashboard-page-subtitle">
            Here&apos;s an overview of your tournament management dashboard.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid">
        <Card className="dash-stat-card" id="stat-orgs">
          <div className="dash-stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="dash-stat-value">{orgs.length}</div>
          <div className="dash-stat-label">Organizations</div>
        </Card>
        <Card className="dash-stat-card" id="stat-tournaments">
          <div className="dash-stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="dash-stat-value">
            {orgs.reduce((sum, org) => sum + (org.tournament_count || 0), 0)}
          </div>
          <div className="dash-stat-label">Total Tournaments</div>
        </Card>
        <Card className="dash-stat-card" id="stat-followers">
          <div className="dash-stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <div className="dash-stat-value">
            {orgs.reduce((sum, org) => sum + (org.follower_count || 0), 0)}
          </div>
          <div className="dash-stat-label">Total Followers</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)' }}>
          Quick Actions
        </h3>
        <div className="quick-actions">
          <Link href="/dashboard/org/new" className="quick-action-card" id="quick-new-org">
            <svg className="quick-action-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="quick-action-label">Create Organization</span>
            <span className="quick-action-desc">Start a new tournament org</span>
          </Link>
          <Link
            href={orgs.length > 0 ? `/dashboard/org/${orgs[0].id}/tournaments/new` : '/dashboard/org/new'}
            className="quick-action-card"
            id="quick-new-tournament"
          >
            <svg className="quick-action-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="quick-action-label">New Tournament</span>
            <span className="quick-action-desc">Create a new event</span>
          </Link>
          <Link href="/dashboard/profile" className="quick-action-card" id="quick-edit-profile">
            <svg className="quick-action-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="quick-action-label">Edit Profile</span>
            <span className="quick-action-desc">Update your info & IGN</span>
          </Link>
        </div>
      </div>

      {/* Your Organizations */}
      {orgs.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)' }}>
            Your Organizations
          </h3>
          <div className="dashboard-grid">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/dashboard/org/${org.id}`}
                style={{ textDecoration: 'none' }}
              >
                <Card interactive className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar src={org.avatar_url} alt={org.name} size="lg" fallback="🏰" />
                    <div>
                      <div className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>
                        {org.name}
                      </div>
                      <Badge variant={getRoleVariant(org.role)}>
                        {org.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-6 mt-4">
                    <div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-text-white)' }}>
                        {org.tournament_count || 0}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Tournaments</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-text-white)' }}>
                        {org.follower_count || 0}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Followers</div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4" style={{ marginTop: 'var(--space-4)' }}>
          <div style={{ color: 'var(--color-text-muted)' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>No organizations yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '360px', marginBottom: 'var(--space-2)' }}>
            Create your first organization to start managing tournaments and whitelist syncing.
          </p>
          <Link href="/dashboard/org/new" className="btn btn-primary" id="dash-create-org-btn">
            + Create Organization
          </Link>
        </Card>
      )}
    </div>
  )
}
