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
  
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput, setBioInput] = useState('')
  const [savingBio, setSavingBio] = useState(false)

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
      setBioInput(orgData?.bio || '')

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

  const handleSaveBio = async () => {
    setSavingBio(true)
    const { error } = await supabase.from('organizations').update({ bio: bioInput }).eq('id', org.id)
    if (!error) {
      setOrg({ ...org, bio: bioInput })
      setEditingBio(false)
    }
    setSavingBio(false)
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
          <div className="flex items-center gap-4 mb-2">
            <p className="dashboard-page-subtitle" style={{ margin: 0 }}>{org.bio || 'No description set.'}</p>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/organizations/${org.slug}`);
                alert('Public link copied to clipboard!');
              }}
            >
              🔗 Copy Public Link
            </button>
          </div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="md:col-span-2 flex flex-col gap-8">
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
            {(() => {
              const soonTournaments = tournaments.filter(t => t.status === 'SOON')
              return (
                <>
                  <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)' }}>
                    Upcoming Tournaments ({soonTournaments.length})
                  </h3>
                  {soonTournaments.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {soonTournaments.map((t) => (
                        <Link
                          key={t.id}
                          href={`/dashboard/org/${orgId}/tournaments/${t.id}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <div className="td-card td-card-interactive gaming-glow-hover" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-5)' }}>
                            <div className="flex items-center gap-4" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)', marginRight: '8px', flexShrink: 0 }}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              <div style={{ textAlign: 'left' }}>
                                <div className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0, fontWeight: '600' }}>
                                  {t.name}
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                  {t.player_count} players &bull; Created {new Date(t.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                              <Badge variant="primary">
                                {t.status}
                              </Badge>
                              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </div>
                          </div>
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
                      <h4 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>No upcoming tournaments</h4>
                      <p style={{ color: 'var(--color-text-secondary)', maxWidth: '360px', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                        No tournaments scheduled in the SOON status.
                      </p>
                      {(userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
                        <Link href={`/dashboard/org/${orgId}/tournaments/new`} className="btn btn-primary">
                          + Create Tournament
                        </Link>
                      )}
                    </Card>
                  )}
                </>
              )
            })()}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="md:col-span-1 flex flex-col gap-6">
          
          {/* Announcement Management */}
          <Card className="p-5" style={{ border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" style={{ color: 'var(--color-primary)' }}>
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
                </svg>
                Announcements
              </h3>
              {(userRole === 'OWNER' || userRole === 'ADMIN') && !editingBio && (
                <button onClick={() => setEditingBio(true)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '10px' }}>
                  Edit
                </button>
              )}
            </div>

            {editingBio ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Enter organization announcement or bio..."
                  style={{
                    width: '100%', minHeight: '100px', padding: '12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', resize: 'vertical'
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => { setEditingBio(false); setBioInput(org.bio || '') }} disabled={savingBio}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveBio} disabled={savingBio}>
                    {savingBio ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap' }}>
                {org.bio ? org.bio : <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No announcements posted.</span>}
              </div>
            )}
          </Card>

          {/* Highlights Management */}
          <Card className="p-5" style={{ border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" style={{ color: '#EAB308' }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Highlights
              </h3>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Highlights are automatically populated from your recently ended tournaments.
            </p>

            {tournaments.filter(t => t.status === 'ENDED').length > 0 ? (
              <div className="flex flex-col gap-3">
                {tournaments.filter(t => t.status === 'ENDED').slice(0, 3).map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'var(--color-bg-alt)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Ended {new Date(t.ends_at || t.created_at).toLocaleDateString()}</div>
                    </div>
                    <Link href={`/dashboard/org/${orgId}/tournaments/${t.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '10px' }}>
                      View
                    </Link>
                  </div>
                ))}
                {tournaments.filter(t => t.status === 'ENDED').length > 3 && (
                  <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    + {tournaments.filter(t => t.status === 'ENDED').length - 3} more ended tournaments
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', border: '1px dashed var(--color-border)', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No ended tournaments yet.</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
