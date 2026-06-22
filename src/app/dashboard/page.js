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
  const [joinedTournaments, setJoinedTournaments] = useState([])
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

        // Get joined tournaments
        const { data: regList } = await supabase
          .from('tournament_registrations')
          .select(`
            id,
            minecraft_ign,
            status,
            registered_at,
            tournaments (
              id, name, slug, status,
              organizations ( name )
            )
          `)
          .eq('user_id', user.id)
          .order('registered_at', { ascending: false })

        if (regList && regList.length > 0) {
          const selectedTids = regList
            .filter(r => r.status === 'SELECTED' && r.tournaments)
            .map(r => r.tournaments.id)

          let ipMap = {}
          if (selectedTids.length > 0) {
            const { data: ipData } = await supabase
              .from('tournament_server_ips')
              .select('*')
              .in('tournament_id', selectedTids)

            if (ipData) {
              ipData.forEach(ip => {
                ipMap[ip.tournament_id] = ip
              })
            }
          }

          const activeRegs = regList.filter(r => r.tournaments && r.tournaments.status !== 'ENDED')
          setJoinedTournaments(activeRegs.map(r => ({
            ...r,
            serverIpInfo: ipMap[r.tournaments?.id] || null
          })))
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleCancelRegistration = async (regId, tournamentId, tournamentName) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for "${tournamentName}"?`)) return
    
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('id', regId)

      if (error) throw error

      setJoinedTournaments(prev => prev.filter(r => r.id !== regId))
    } catch (err) {
      alert(`Failed to cancel registration: ${err.message}`)
    }
  }

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
          <Link
            href={orgs.length > 0 ? `/dashboard/org/${orgs[0].id}` : '/dashboard/org/new'}
            className="quick-action-card"
            id="quick-organizations"
          >
            <svg className="quick-action-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="quick-action-label">Organizations</span>
            <span className="quick-action-desc">
              {orgs.length > 0 ? 'Manage your organizations' : 'Start a new organization'}
            </span>
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
      {/* Joined Tournaments */}
      <div className="flex flex-col gap-3" style={{ marginTop: 'var(--space-4)' }}>
        <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)' }}>
          🎮 Tournaments Joined ({joinedTournaments.length})
        </h3>
        {joinedTournaments.length > 0 ? (
          <div className="dashboard-grid">
            {joinedTournaments.map((reg) => {
              const t = reg.tournaments
              if (!t) return null
              const isSelected = reg.status === 'SELECTED'
              const revealIp = reg.serverIpInfo?.ip_revealed && reg.serverIpInfo?.server_ip
              const isEnded = t.status === 'ENDED'

              return (
                <Card key={reg.id} className="p-6">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <Link href={`/tournaments/${t.slug}`} style={{ textDecoration: 'none' }}>
                        <div className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)', color: 'var(--color-primary)' }}>
                          {t.name}
                        </div>
                      </Link>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        Organized by {t.organizations?.name || 'Unknown'}
                      </div>
                    </div>
                    <Badge variant={t.status === 'ONGOING' ? 'success' : t.status === 'SOON' ? 'primary' : 'neutral'}>
                      {t.status}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-3" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '12px' }}>
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Minecraft IGN:</span>
                      <span style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>{reg.minecraft_ign}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Your Status:</span>
                      <Badge variant={isSelected ? 'success' : reg.status === 'REJECTED' ? 'danger' : 'primary'}>
                        {reg.status === 'SELECTED' ? 'Approved / Whitelisted' : reg.status === 'REJECTED' ? 'Rejected' : 'Pending Review'}
                      </Badge>
                    </div>

                    {/* Server IP sharing block */}
                    {isSelected && (
                      <div style={{ borderTop: '1px dotted var(--color-border)', paddingTop: '12px', marginTop: '4px' }}>
                        {isEnded ? (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>🔌 Server IP: Hidden (Tournament has ended)</div>
                        ) : revealIp ? (
                          <div>
                            <div className="td-input-label" style={{ fontSize: '11px', color: 'var(--color-primary)' }}>SERVER CONNECTION IP</div>
                            <div className="flex gap-2 mt-1">
                              <input
                                className="td-input-field"
                                value={reg.serverIpInfo.server_ip}
                                readOnly
                                style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', flex: 1, height: '28px', padding: '0 8px' }}
                              />
                              <Button variant="secondary" size="sm" style={{ height: '28px', padding: '0 10px', fontSize: 'var(--text-xs)' }} onClick={() => {
                                navigator.clipboard.writeText(reg.serverIpInfo.server_ip)
                                alert('IP copied to clipboard!')
                              }}>Copy</Button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>⏳ Server IP: Will be revealed soon</div>
                        )}
                      </div>
                    )}

                    {t.status === 'SOON' && (
                      <div style={{ borderTop: '1px dotted var(--color-border)', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="danger"
                          size="sm"
                          style={{ fontSize: 'var(--text-xs)', height: '28px', padding: '0 10px' }}
                          onClick={() => handleCancelRegistration(reg.id, t.id, t.name)}
                        >
                          Cancel Registration
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

        ) : (
          <Card className="p-6 text-center" style={{ backgroundColor: 'var(--color-bg-alt)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
              You haven&apos;t joined any tournaments yet. Browse the <Link href="/tournaments" style={{ color: 'var(--color-primary)' }}>Tournaments page</Link> to sign up!
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
