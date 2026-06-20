'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

export default function OrgApplicationsPage() {
  const { orgId } = useParams()
  const router = useRouter()
  
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dbMissing, setDbMissing] = useState(false)
  const [userRole, setUserRole] = useState(null)

  // Approval modal states
  const [selectedApp, setSelectedApp] = useState(null)
  const [assignedRole, setAssignedRole] = useState('STAFF')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const supabase = createClient()

  const loadApplications = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Check user's role in this org
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle()
      
      setUserRole(membership?.role)

      if (membership?.role !== 'OWNER' && membership?.role !== 'ADMIN' && membership?.role !== 'MANAGER') {
        setLoading(false)
        return
      }

      // Fetch pending applications
      const { data: appsData, error: appsError } = await supabase
        .from('organization_applications')
        .select(`
          *,
          users(id, display_name, username, avatar_url, minecraft_ign)
        `)
        .eq('organization_id', orgId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (appsError) {
        if (appsError.code === 'PGRST116' || appsError.message.includes('relation "public.organization_applications" does not exist') || appsError.message.includes('does not exist')) {
          setDbMissing(true)
        } else {
          console.error(appsError)
        }
      } else {
        setApplications(appsData || [])
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadApplications()
  }, [orgId])

  const handleDecline = async (appId) => {
    if (!confirm('Are you sure you want to decline this application?')) return
    setActionLoading(true)
    setActionError('')

    const { error } = await supabase
      .from('organization_applications')
      .update({ status: 'REJECTED' })
      .eq('id', appId)

    if (error) {
      alert(`Error declining application: ${error.message}`)
    } else {
      loadApplications()
    }
    setActionLoading(false)
  }

  const handleApproveConfirm = async (e) => {
    e.preventDefault()
    if (!selectedApp) return

    setActionLoading(true)
    setActionError('')

    // 1. Add user to organization_members
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: selectedApp.user_id,
        role: assignedRole,
        minecraft_ign: selectedApp.users?.minecraft_ign || null
      })

    if (memberError) {
      if (memberError.message.includes('duplicate')) {
        setActionError('This user is already a member of this organization.')
      } else {
        setActionError(memberError.message)
      }
      setActionLoading(false)
      return
    }

    // 2. Update application status to APPROVED
    const { error: appError } = await supabase
      .from('organization_applications')
      .update({ status: 'APPROVED' })
      .eq('id', selectedApp.id)

    if (appError) {
      setActionError(appError.message)
    } else {
      setSelectedApp(null)
      setAssignedRole('STAFF')
      loadApplications()
    }
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="dashboard-page-header">
          <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '300px', height: '18px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="skeleton" style={{ height: '120px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
    )
  }

  if (userRole !== 'OWNER' && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>Access Denied</h2>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '360px' }}>
          Only organization Owners, Admins, and Managers are permitted to review team applications.
        </p>
        <Button onClick={() => router.push(`/dashboard/org/${orgId}`)}>Back to Org Dashboard</Button>
      </Card>
    )
  }

  const filteredApps = applications.filter(app => {
    const term = search.toLowerCase()
    return (
      app.users?.display_name?.toLowerCase().includes(term) ||
      app.users?.username?.toLowerCase().includes(term) ||
      app.role_applied?.toLowerCase().includes(term)
    )
  })

  return (
    <div id="org-applications-page" className="flex flex-col gap-8">
      {/* Header */}
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Team Applications</h1>
          <p className="dashboard-page-subtitle">Review pending requests from candidates wanting to join your team.</p>
        </div>
      </div>

      {dbMissing ? (
        <Card style={{ borderColor: 'var(--color-warning)', backgroundColor: 'rgba(245, 158, 11, 0.03)' }} className="p-6">
          <h3 style={{ fontWeight: '600', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            ⚠️ Database Setup Required (Join Applications)
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
            To view candidates&apos; applications, please run the SQL setup script inside your Supabase dashboard SQL editor.
          </p>
          <Button onClick={() => router.push('/dashboard/org')}>Go to SQL Migrations Guide</Button>
        </Card>
      ) : (
        <>
          {/* Search bar */}
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <Input
              placeholder="Search by candidate name or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Applications list */}
          {filteredApps.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredApps.map((app) => (
                <Card key={app.id} className="p-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar src={app.users?.avatar_url} alt={app.users?.display_name || app.users?.username} size="md" fallback="👤" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>
                            {app.users?.display_name || 'Anonymous'}
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            @{app.users?.username}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          Applied for role: <strong style={{ color: 'var(--color-primary)' }}>{app.role_applied}</strong> &bull; Received on {new Date(app.created_at).toLocaleDateString()}
                          {app.users?.minecraft_ign && (
                            <> &bull; IGN: <strong style={{ color: 'var(--color-success)' }}>{app.users.minecraft_ign}</strong></>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => handleDecline(app.id)}
                        disabled={actionLoading}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app)
                          setAssignedRole('STAFF')
                          setActionError('')
                        }}
                        disabled={actionLoading}
                      >
                        Approve Candidate
                      </Button>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '16px',
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 'var(--leading-relaxed)',
                  }}>
                    {app.message}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <span style={{ fontSize: '2rem' }}>📦</span>
              <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>No pending applications</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {search ? 'Try clearing your search filters.' : 'There are no candidate applications pending review right now.'}
              </p>
            </Card>
          )}
        </>
      )}

      {/* Role Selection Modal */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title="Approve Team Application"
        >
          {actionError && (
            <div className="auth-error mb-4">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{actionError}</span>
            </div>
          )}

          <form onSubmit={handleApproveConfirm} className="flex flex-col gap-4">
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Approve <strong>{selectedApp.users?.display_name || selectedApp.users?.username}</strong> to join your organization team.
            </p>

            <div className="td-input-group">
              <label className="td-input-label">Select Assigned Role *</label>
              <select
                className="td-input-field"
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
              >
                {(userRole === 'OWNER' || userRole === 'ADMIN') && <option value="ADMIN">Admin (Manage members & permissions)</option>}
                {(userRole === 'OWNER' || userRole === 'ADMIN') && <option value="MANAGER">Manager (Can manage events & whitelist)</option>}
                <option value="STAFF">Staff (Can view data & log results)</option>
              </select>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Their permissions on the dashboard will be determined by the role selected above.
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setSelectedApp(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>
                Confirm Approval & Assign
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
