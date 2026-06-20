'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function OrgDashboardPage() {
  const { orgId } = useParams()
  const [org, setOrg] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [members, setMembers] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      // Get org
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()
      setOrg(orgData)

      // Get user's role
      if (user) {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', orgId)
          .eq('user_id', user.id)
          .single()
        setUserRole(membership?.role)
      }

      // Get tournaments
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
      setTournaments(tournamentData || [])

      // Get members
      const { data: memberData } = await supabase
        .from('organization_members')
        .select(`
          *,
          users (display_name, username, avatar_url)
        `)
        .eq('organization_id', orgId)
      setMembers(memberData || [])

      setLoading(false)
    }
    loadData()
  }, [orgId])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="dashboard-page-header">
          <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '300px', height: '18px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className="dashboard-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '120px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
        <div style={{ color: 'var(--color-text-muted)' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>Organization not found</h2>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '360px', marginBottom: 'var(--space-2)' }}>
          This organization doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </Card>
    )
  }

  const statusCounts = {
    soon: tournaments.filter(t => t.status === 'SOON').length,
    ongoing: tournaments.filter(t => t.status === 'ONGOING').length,
    ended: tournaments.filter(t => t.status === 'ENDED').length,
  }

  const getRoleVariant = (role) => {
    switch (role) {
      case 'OWNER': return 'primary'
      case 'ADMIN': return 'success'
      case 'MANAGER': return 'warning'
      case 'STAFF': return 'info'
      default: return 'neutral'
    }
  }

  return (
    <div id="org-dashboard" className="flex flex-col gap-8">
      {/* Header */}
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="dashboard-page-title">{org.name}</h1>
            {userRole && (
              <Badge variant={getRoleVariant(userRole)}>
                {userRole}
              </Badge>
            )}
          </div>
          <p className="dashboard-page-subtitle">{org.bio || 'No description set.'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid">
        <Card className="dash-stat-card">
          <div className="dash-stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="dash-stat-value">{tournaments.length}</div>
          <div className="dash-stat-label">Total Tournaments</div>
        </Card>
        <Card className="dash-stat-card">
          <div className="dash-stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </div>
          <div className="dash-stat-value">{statusCounts.ongoing}</div>
          <div className="dash-stat-label">Live Now</div>
        </Card>
        <Card className="dash-stat-card">
          <div className="dash-stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <div className="dash-stat-value">{org.follower_count}</div>
          <div className="dash-stat-label">Followers</div>
        </Card>
        <Card className="dash-stat-card">
          <div className="dash-stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="dash-stat-value">{members.length}</div>
          <div className="dash-stat-label">Team Members</div>
        </Card>
      </div>

      {/* Quick Actions */}
      {(userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
        <div className="flex flex-col gap-3">
          <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)' }}>Quick Actions</h3>
          <div className="quick-actions">
            <Link href={`/dashboard/org/${orgId}/tournaments/new`} className="quick-action-card">
              <svg className="quick-action-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="quick-action-label">New Tournament</span>
              <span className="quick-action-desc">Create a new event</span>
            </Link>
            <Link href={`/dashboard/org/${orgId}/members`} className="quick-action-card">
              <svg className="quick-action-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="quick-action-label">Manage Team</span>
              <span className="quick-action-desc">Add or manage members</span>
            </Link>
            <Link href={`/dashboard/org/${orgId}/settings`} className="quick-action-card">
              <svg className="quick-action-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span className="quick-action-label">Settings</span>
              <span className="quick-action-desc">Edit org details</span>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Tournaments */}
      <div className="flex flex-col gap-3">
        <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)' }}>
          Tournaments ({tournaments.length})
        </h3>
        {tournaments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/org/${orgId}/tournaments/${t.id}`}
                style={{ textDecoration: 'none' }}
              >
                <Card interactive className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <div>
                      <div className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {t.player_count} players &bull; Created {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={t.status === 'ONGOING' ? 'success' : t.status === 'SOON' ? 'primary' : 'neutral'}>
                      {t.status}
                    </Badge>
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
            <div style={{ color: 'var(--color-text-muted)' }}>
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h4 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>No tournaments yet</h4>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '360px', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              Create your first tournament to get started with whitelisting and statistics.
            </p>
            <Link href={`/dashboard/org/${orgId}/tournaments/new`} className="btn btn-primary">
              + Create Tournament
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
