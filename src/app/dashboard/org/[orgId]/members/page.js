'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'

export default function MembersPage() {
  const { orgId } = useParams()
  const router = useRouter()
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [myMemberId, setMyMemberId] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addUsername, setAddUsername] = useState('')
  const [addRole, setAddRole] = useState('STAFF')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const supabase = createClient()

  const loadMembers = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    // Load active members
    const { data: membersData } = await supabase
      .from('organization_members')
      .select(`
        *,
        users (id, display_name, username, avatar_url, minecraft_ign)
      `)
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: true })
    setMembers(membersData || [])

    // Load pending invites
    const { data: invitesData } = await supabase
      .from('organization_invites')
      .select(`
        *,
        users:invited_user_id (id, display_name, username, avatar_url)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
    setInvites(invitesData || [])

    if (user) {
      setCurrentUserId(user.id)
      const myMembership = membersData?.find(m => m.user_id === user.id)
      setUserRole(myMembership?.role)
      setMyMemberId(myMembership?.id || null)
    }
    setLoading(false)
  }

  useEffect(() => { loadMembers() }, [orgId])

  const handleAddMember = async (e) => {
    e.preventDefault()
    setAddLoading(true)
    setAddError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setAddError('You must be logged in to send invites.')
      setAddLoading(false)
      return
    }

    const { data: foundUser } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', addUsername.trim().toLowerCase())
      .single()

    if (!foundUser) {
      setAddError('User not found. They must have a TournaDash account first.')
      setAddLoading(false)
      return
    }

    if (foundUser.id === user.id) {
      setAddError('You cannot invite yourself.')
      setAddLoading(false)
      return
    }

    // Check if already a member
    const existing = members.find(m => m.user_id === foundUser.id)
    if (existing) {
      setAddError('This user is already a member of this organization.')
      setAddLoading(false)
      return
    }

    // Check if already invited
    const existingInvite = invites.find(i => i.invited_user_id === foundUser.id)
    if (existingInvite) {
      setAddError('An invitation has already been sent to this user.')
      setAddLoading(false)
      return
    }

    const { error } = await supabase
      .from('organization_invites')
      .insert({
        organization_id: orgId,
        invited_user_id: foundUser.id,
        invited_by: user.id,
        role: addRole,
        status: 'PENDING',
      })

    if (error) {
      setAddError(error.message)
    } else {
      setShowAddModal(false)
      setAddUsername('')
      setAddRole('STAFF')
      loadMembers()
    }
    setAddLoading(false)
  }

  const handleCancelInvite = async (inviteId) => {
    if (!confirm('Cancel this invitation?')) return
    const { error } = await supabase
      .from('organization_invites')
      .delete()
      .eq('id', inviteId)

    if (!error) loadMembers()
  }

  const handleRoleChange = async (memberId, newRole) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (!error) loadMembers()
  }

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from the organization?`)) return

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)

    if (!error) loadMembers()
  }

  const handleLeaveOrganization = async () => {
    if (!myMemberId) return
    if (!confirm('Are you sure you want to leave this organization? You will lose all access to its dashboard.')) return

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', myMemberId)

    if (error) {
      alert(`Failed to leave organization: ${error.message}`)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="dashboard-page-header">
          <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '300px', height: '18px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: '72px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
    )
  }

  const isOwner = userRole === 'OWNER'
  const isAdmin = userRole === 'ADMIN'
  const canInvite = userRole === 'OWNER' || userRole === 'ADMIN'
  const canManage = userRole === 'OWNER' || userRole === 'MANAGER'
  const canViewApplications = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MANAGER'

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
    <div id="members-page" className="flex flex-col gap-8">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Team Members</h1>
          <p className="dashboard-page-subtitle">{members.length} members in this organization</p>
        </div>
        <div className="flex gap-3">
          {userRole && userRole !== 'OWNER' && (
            <Button variant="danger" onClick={handleLeaveOrganization}>
              Leave Organization
            </Button>
          )}
          {canViewApplications && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/org/${orgId}/applications`)} id="view-applications-btn">
              Applications
            </Button>
          )}
          {canInvite && (
            <Button onClick={() => setShowAddModal(true)} id="add-member-btn">
              + Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* RBAC Legend */}
      <div style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        padding: '6px 14px',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        alignSelf: 'flex-start',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Legend:</span>
        <div className="flex gap-4 flex-wrap items-center" style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            <Badge variant="primary" style={{ fontSize: '9px', padding: '2px 6px' }}>Owner</Badge> Full control
          </div>
          <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            <Badge variant="success" style={{ fontSize: '9px', padding: '2px 6px' }}>Admin</Badge> Manage permissions
          </div>
          <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            <Badge variant="warning" style={{ fontSize: '9px', padding: '2px 6px' }}>Manager</Badge> Manage events
          </div>
          <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            <Badge variant="info" style={{ fontSize: '9px', padding: '2px 6px' }}>Staff</Badge> View data
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="flex flex-col gap-3">
        {members.map((member) => (
          <Card key={member.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  src={member.users?.avatar_url}
                  alt={member.users?.display_name || 'Member'}
                  size="md"
                  fallback={member.users?.display_name?.[0]?.toUpperCase() || 'M'}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>
                      {member.users?.display_name || 'Unknown'}
                    </span>
                    <Badge variant={getRoleVariant(member.role)}>{member.role}</Badge>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    @{member.users?.username} 
                    {member.users?.minecraft_ign && (
                      <> &bull; IGN: <strong style={{ color: 'var(--color-primary)' }}>{member.users.minecraft_ign}</strong></>
                    )}
                  </div>
                </div>
              </div>

              {(isOwner || isAdmin) && member.role !== 'OWNER' && member.user_id !== currentUserId && (
                <div className="flex items-center gap-3">
                  <select
                    className="td-input-field"
                    style={{ width: 'auto', padding: '0 var(--space-4)', fontSize: 'var(--text-xs)', height: '32px' }}
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => handleRemoveMember(member.id, member.users?.display_name)}
                  >
                    Remove
                  </Button>
                </div>
              )}
              {member.role === 'OWNER' && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Organization Owner
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Pending Invites Section */}
      {invites.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-white)' }}>Pending Invitations</h3>
          <div className="flex flex-col gap-3">
            {invites.map((invite) => (
              <Card key={invite.id} className="p-5" style={{ borderColor: 'var(--color-border-hover)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={invite.users?.avatar_url}
                      alt={invite.users?.display_name || 'Invited'}
                      size="md"
                      fallback={invite.users?.display_name?.[0]?.toUpperCase() || 'U'}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>
                          {invite.users?.display_name || 'Unknown'}
                        </span>
                        <Badge variant="neutral">Pending {invite.role}</Badge>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        @{invite.users?.username}
                      </div>
                    </div>
                  </div>

                  {canInvite && (
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                      onClick={() => handleCancelInvite(invite.id)}
                    >
                      Cancel Invite
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Invite Team Member"
      >
        {addError && (
          <div className="auth-error mb-4">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{addError}</span>
          </div>
        )}

        <form onSubmit={handleAddMember} className="flex flex-col gap-4">
          <Input
            label="Username"
            placeholder="Enter their TournaDash username"
            value={addUsername}
            onChange={(e) => setAddUsername(e.target.value)}
            required
            helperText="They must have registered an account on this site first."
          />

          <div className="td-input-group">
            <label className="td-input-label">Role *</label>
            <select
              className="td-input-field"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value)}
            >
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addLoading}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
