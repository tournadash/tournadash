'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function MyOrganizationsPage() {
  const [user, setUser] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [applications, setApplications] = useState([])
  const [activeTab, setActiveTab] = useState('orgs')
  const [loading, setLoading] = useState(true)
  const [dbMissing, setDbMissing] = useState(false)

  // Search & Apply states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [roleApplied, setRoleApplied] = useState('')
  const [message, setMessage] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState('')
  const [pendingChecks, setPendingChecks] = useState({ isMember: false, hasPendingApp: false })

  const supabase = createClient()
  const router = useRouter()

  const countWords = (text) => {
    if (!text) return 0
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  const loadData = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)

    if (u) {
      // Fetch user's organizations
      const { data: memberships } = await supabase
        .from('organization_members')
        .select(`
          role,
          organizations (
            id, name, slug, avatar_url, tournament_count, follower_count, bio
          )
        `)
        .eq('user_id', u.id)

      if (memberships) {
        setOrgs(memberships.map(m => ({
          ...m.organizations,
          role: m.role,
        })))
      }

      // Fetch user's applications
      const { data: apps, error: appsError } = await supabase
        .from('organization_applications')
        .select('*, organizations(name, slug, avatar_url)')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })

      if (appsError) {
        if (appsError.code === 'PGRST116' || appsError.message.includes('relation "public.organization_applications" does not exist') || appsError.message.includes('does not exist')) {
          setDbMissing(true)
        } else {
          console.error(appsError)
        }
      } else {
        setApplications(apps || [])
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Search for organizations
  useEffect(() => {
    const searchOrgs = async () => {
      const query = searchQuery.trim()
      if (query.length < 2) {
        setSearchResults([])
        return
      }

      setSearching(true)
      const { data } = await supabase
        .from('organizations')
        .select('id, name, slug, avatar_url, bio')
        .ilike('name', `%${query}%`)
        .limit(10)
      
      setSearchResults(data || [])
      setSearching(false)
    }

    const timer = setTimeout(searchOrgs, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Check if already member or has pending app for selected org
  useEffect(() => {
    if (!selectedOrg || !user) return

    const checkStatus = async () => {
      const isMem = orgs.some(o => o.id === selectedOrg.id)
      
      let hasPending = false
      if (!dbMissing) {
        const { data: pending } = await supabase
          .from('organization_applications')
          .select('id')
          .eq('organization_id', selectedOrg.id)
          .eq('user_id', user.id)
          .eq('status', 'PENDING')
          .maybeSingle()
        hasPending = !!pending
      }

      setPendingChecks({ isMember: isMem, hasPendingApp: hasPending })
    }

    checkStatus()
  }, [selectedOrg, user, orgs, dbMissing])

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    if (!selectedOrg || !user) return
    
    setApplyError('')
    setApplySuccess('')

    if (!roleApplied.trim()) {
      setApplyError('Role applied for is required.')
      return
    }

    if (!message.trim()) {
      setApplyError('Detailed cover letter is required.')
      return
    }

    const wordCount = countWords(message)
    if (wordCount > 500) {
      setApplyError('Your detailed message exceeds the 500 words limit.')
      return
    }

    setSubmitLoading(true)

    const { error } = await supabase
      .from('organization_applications')
      .insert({
        organization_id: selectedOrg.id,
        user_id: user.id,
        role_applied: roleApplied.trim(),
        message: message.trim(),
        status: 'PENDING',
      })

    if (error) {
      setApplyError(error.message)
    } else {
      setApplySuccess('Your application has been submitted successfully!')
      setRoleApplied('')
      setMessage('')
      setSelectedOrg(null)
      setSearchQuery('')
      loadData()
      setTimeout(() => {
        setApplySuccess('')
        setActiveTab('applications')
      }, 2000)
    }
    setSubmitLoading(false)
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
      default: return 'neutral'
    }
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'danger'
      default: return 'warning'
    }
  }

  const wordCount = countWords(message)

  return (
    <div id="my-organizations-page" className="flex flex-col gap-8">
      {/* Header */}
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">My Organizations</h1>
          <p className="dashboard-page-subtitle">Manage, create, or apply to join organizations.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setActiveTab('apply')}>
            Apply to Join
          </Button>
          <Link href="/dashboard/org/new" className="btn btn-primary">
            + Create Organization
          </Link>
        </div>
      </div>

      {dbMissing && (
        <Card style={{ borderColor: 'var(--color-warning)', backgroundColor: 'rgba(245, 158, 11, 0.03)' }} className="p-6">
          <h3 style={{ fontWeight: '600', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            ⚠️ Database Setup Required (Join Applications)
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
            The application system is active in the codebase, but the database tables have not been created yet in your Supabase backend. Please run the following SQL script inside your Supabase dashboard SQL editor to enable this system:
          </p>
          <pre style={{
            background: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-white)',
            fontSize: 'var(--text-xs)',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
{`CREATE TABLE IF NOT EXISTS public.organization_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_applied TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organization_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own applications" ON public.organization_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to submit applications" ON public.organization_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow org members to view applications" ON public.organization_applications FOR SELECT USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organization_applications.organization_id AND user_id = auth.uid()));
CREATE POLICY "Allow managers to update status" ON public.organization_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organization_applications.organization_id AND user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')));`}
          </pre>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
        <button
          onClick={() => setActiveTab('orgs')}
          className={`btn btn-sm ${activeTab === 'orgs' ? 'btn-primary' : 'btn-ghost'}`}
        >
          My Organizations ({orgs.length})
        </button>
        {!dbMissing && (
          <button
            onClick={() => setActiveTab('applications')}
            className={`btn btn-sm ${activeTab === 'applications' ? 'btn-primary' : 'btn-ghost'}`}
          >
            My Applications ({applications.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('apply')}
          className={`btn btn-sm ${activeTab === 'apply' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Apply to Join
        </button>
      </div>

      {/* Tab: Organizations */}
      {activeTab === 'orgs' && (
        orgs.length > 0 ? (
          <div className="dashboard-grid">
            {orgs.map((org) => (
              <Link key={org.id} href={`/dashboard/org/${org.id}`} style={{ textDecoration: 'none' }}>
                <Card interactive className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar src={org.avatar_url} alt={org.name} size="md" fallback="🏰" />
                      <div>
                        <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: '2px' }}>
                          {org.name}
                        </h3>
                        <Badge variant={getRoleVariant(org.role)}>{org.role}</Badge>
                      </div>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '32px' }}>
                      {org.bio || 'No description set.'}
                    </p>
                  </div>
                  <div className="flex gap-4 mt-6 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      🏆 {org.tournament_count || 0} Tournaments
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      👥 {org.follower_count || 0} Followers
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center flex flex-col items-center justify-center gap-4">
            <span style={{ fontSize: '3rem' }}>🏰</span>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>You don&apos;t have any organization</h3>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
              Create your own organization to host tournaments or search for existing organizations to apply for a role.
            </p>
            <div className="flex gap-4 mt-2">
              <Button variant="secondary" onClick={() => setActiveTab('apply')}>
                Apply to Join
              </Button>
              <Link href="/dashboard/org/new" className="btn btn-primary">
                Create Organization
              </Link>
            </div>
          </Card>
        )
      )}

      {/* Tab: Applications */}
      {activeTab === 'applications' && !dbMissing && (
        applications.length > 0 ? (
          <div className="flex flex-col gap-4">
            {applications.map((app) => (
              <Card key={app.id} className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={app.organizations?.avatar_url} alt={app.organizations?.name} size="md" fallback="🏰" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/organizations/${app.organizations?.slug}`} style={{ fontWeight: '600', color: 'var(--color-text-white)', textDecoration: 'none' }} className="gaming-glow-hover">
                          {app.organizations?.name}
                        </Link>
                        <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Applied for role: <strong style={{ color: 'var(--color-text-white)' }}>{app.role_applied}</strong> &bull; Sent on {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{
                  marginTop: '16px',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {app.message}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <span style={{ fontSize: '2rem' }}>📝</span>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>No applications sent</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>You haven&apos;t applied to join any organization yet.</p>
          </Card>
        )
      )}

      {/* Tab: Apply to Join */}
      {activeTab === 'apply' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedOrg ? '1fr 1.2fr' : '1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          {/* Search Box */}
          <div className="flex flex-col gap-4">
            <Card className="p-6">
              <h3 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-base)' }}>Search Organizations</h3>
              <Input
                placeholder="Type organization name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                Type at least 2 characters to search the network
              </p>
            </Card>

            {searchQuery.trim().length >= 2 && (
              <div className="flex flex-col gap-3">
                {searching ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                    <span className="btn-spinner" style={{ color: 'var(--color-primary)' }} />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(org => {
                    const isSelected = selectedOrg?.id === org.id
                    return (
                      <Card
                        key={org.id}
                        interactive
                        onClick={() => {
                          setSelectedOrg(org)
                          setApplyError('')
                          setApplySuccess('')
                        }}
                        style={{ borderColor: isSelected ? 'var(--color-primary)' : undefined }}
                        className="p-4 flex items-center gap-4"
                      >
                        <Avatar src={org.avatar_url} alt={org.name} size="sm" fallback="🏰" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>{org.name}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {org.bio || 'No bio description set.'}
                          </div>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <Card className="p-4 text-center">
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>No organizations found.</span>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Form */}
          {selectedOrg && (
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <Avatar src={selectedOrg.avatar_url} alt={selectedOrg.name} size="md" fallback="🏰" />
                <div>
                  <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-md)', marginBottom: '2px' }}>
                    Apply to {selectedOrg.name}
                  </h3>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>@{selectedOrg.slug}</span>
                </div>
              </div>

              {pendingChecks.isMember ? (
                <div className="p-4 text-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)', margin: 0 }}>
                    🛡️ You are already a member of this organization.
                  </p>
                </div>
              ) : pendingChecks.hasPendingApp ? (
                <div className="p-4 text-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px dashed var(--color-warning)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)', margin: 0 }}>
                    ⏳ You already have a pending application submitted to this organization.
                  </p>
                </div>
              ) : dbMissing ? (
                <div className="p-4 text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--color-danger)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', margin: 0 }}>
                    Applications are unavailable because database tables are not set up yet.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="flex flex-col gap-4">
                  {applyError && (
                    <div className="auth-error">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span>{applyError}</span>
                    </div>
                  )}
                  {applySuccess && (
                    <div className="auth-success">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <span>{applySuccess}</span>
                    </div>
                  )}

                  <Input
                    label="Role you are thinking of applying for"
                    placeholder="e.g. Moderator, Administrator, Staff"
                    value={roleApplied}
                    onChange={(e) => setRoleApplied(e.target.value)}
                    required
                    maxLength={100}
                    helperText="One-line summary of your target role"
                  />

                  <div>
                    <Input
                      label="Why should we select you? (Detailed Message)"
                      type="textarea"
                      placeholder="Explain your motivation, past experiences, and what values you bring to this organization..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      style={{ minHeight: '140px' }}
                      error={wordCount > 500 ? 'Message exceeds 500 words limit' : ''}
                    />
                    <div style={{
                      textAlign: 'right',
                      fontSize: 'var(--text-xs)',
                      color: wordCount > 500 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                      marginTop: '4px'
                    }}>
                      {wordCount} / 500 words
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="secondary" onClick={() => setSelectedOrg(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={submitLoading} disabled={wordCount > 500}>
                      Submit Application
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
