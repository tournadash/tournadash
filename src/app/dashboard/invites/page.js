'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

export default function InvitesPage() {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  const loadInvites = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('organization_invites')
      .select(`
        *,
        organizations (id, name, slug, avatar_url)
      `)
      .eq('invited_user_id', user.id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
    
    setInvites(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadInvites()
  }, [])

  const handleAccept = async (invite) => {
    setActionLoading(invite.id)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Add to organization_members
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invite.organization_id,
        user_id: user.id,
        role: invite.role,
      })

    if (memberError) {
      alert(`Error accepting invitation: ${memberError.message}`)
      setActionLoading(null)
      return
    }

    // 2. Delete the invitation
    await supabase
      .from('organization_invites')
      .delete()
      .eq('id', invite.id)

    // 3. Reload invites and refresh layout sidebar
    await loadInvites()
    setActionLoading(null)
    router.refresh()
  }

  const handleDecline = async (inviteId) => {
    setActionLoading(inviteId)
    
    await supabase
      .from('organization_invites')
      .delete()
      .eq('id', inviteId)

    await loadInvites()
    setActionLoading(null)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="dashboard-page-header">
          <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '300px', height: '18px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="skeleton" style={{ height: '100px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
    )
  }

  return (
    <div id="invites-page" className="flex flex-col gap-8">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Organization Invitations</h1>
          <p className="dashboard-page-subtitle">Manage invitations to join other organization teams.</p>
        </div>
      </div>

      {invites.length > 0 ? (
        <div className="flex flex-col gap-4" style={{ maxWidth: '800px' }}>
          {invites.map((invite) => (
            <Card key={invite.id} className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={invite.organizations?.avatar_url}
                    alt={invite.organizations?.name || 'Organization'}
                    size="lg"
                    fallback={invite.organizations?.name?.[0]?.toUpperCase() || 'O'}
                  />
                  <div>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)' }}>
                      {invite.organizations?.name}
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Invited you to join as <Badge variant="primary" style={{ fontSize: '9px', textTransform: 'uppercase', padding: '1px 6px' }}>{invite.role}</Badge>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDecline(invite.id)}
                    disabled={actionLoading === invite.id}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAccept(invite)}
                    loading={actionLoading === invite.id}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-4" style={{ maxWidth: '800px' }}>
          <div style={{ color: 'var(--color-text-muted)' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 0, color: 'var(--color-text-white)' }}>No pending invitations</h3>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>You don&apos;t have any pending invites to join organizations.</p>
        </Card>
      )}
    </div>
  )
}
