'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import './dashboard.css'

export default function DashboardLayout({ children }) {
  const [orgs, setOrgs] = useState([])
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [user, setUser] = useState(null)
  const [inviteCount, setInviteCount] = useState(0)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Get user's organizations
        const { data: memberships } = await supabase
          .from('organization_members')
          .select(`
            role,
            organizations (
              id, name, slug, avatar_url
            )
          `)
          .eq('user_id', user.id)

        if (memberships && memberships.length > 0) {
          const orgList = memberships.map(m => ({
            ...m.organizations,
            role: m.role,
          }))
          setOrgs(orgList)
          setSelectedOrg(orgList[0])
        }

        // Get user's pending invites count
        const { count, error: countErr } = await supabase
          .from('organization_invites')
          .select('*', { count: 'exact', head: true })
          .eq('invited_user_id', user.id)
          .eq('status', 'PENDING')
        
        if (!countErr) {
          setInviteCount(count || 0)
        }
      }
    }
    loadData()
  }, [])

  // Realtime subscription for invites
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('my-invites')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'organization_invites',
        filter: `invited_user_id=eq.${user.id}`,
      }, () => {
        const reloadCount = async () => {
          const { count } = await supabase
            .from('organization_invites')
            .select('*', { count: 'exact', head: true })
            .eq('invited_user_id', user.id)
            .eq('status', 'PENDING')
          setInviteCount(count || 0)
        }
        reloadCount()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const mainLinks = [
    { 
      href: '/dashboard', 
      label: 'Overview', 
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
      ) 
    },
    { 
      href: '/dashboard/invites', 
      label: inviteCount > 0 ? `Invitations (${inviteCount})` : 'Invitations', 
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      badge: inviteCount > 0
    },
    { 
      href: '/dashboard/profile', 
      label: 'My Profile', 
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ) 
    },
  ]

  const orgLinks = selectedOrg ? [
    { 
      href: `/dashboard/org/${selectedOrg.id}`, 
      label: 'Org Dashboard', 
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ) 
    },
    { 
      href: `/dashboard/org/${selectedOrg.id}/settings`, 
      label: 'Settings', 
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ) 
    },
    { 
      href: `/dashboard/org/${selectedOrg.id}/members`, 
      label: 'Team Members', 
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ) 
    },
    { 
      href: `/dashboard/org/${selectedOrg.id}/tournaments`, 
      label: 'Tournaments', 
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ) 
    },
  ] : []

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar" id="dashboard-sidebar">
        {/* Org Switcher */}
        {selectedOrg ? (
          <div className="sidebar-org" id="sidebar-org-switcher">
            <Avatar src={selectedOrg.avatar_url} alt={selectedOrg.name} size="sm" fallback="🏰" className="sidebar-org-avatar" />
            <div className="sidebar-org-info">
              <div className="sidebar-org-name">{selectedOrg.name}</div>
              <div className="sidebar-org-role">{selectedOrg.role}</div>
            </div>
            <svg className="dropdown-arrow-icon" viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        ) : (
          <div style={{ padding: '0 var(--space-6)', marginBottom: 'var(--space-4)' }}>
            <Link
              href="/dashboard/org/new"
              className="btn btn-primary btn-sm w-full"
              style={{ justifyContent: 'center' }}
            >
              + Create Organization
            </Link>
          </div>
        )}

        {/* Main Navigation */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">General</div>
          <ul className="sidebar-nav">
            {mainLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`sidebar-link ${pathname === link.href ? 'sidebar-link-active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="sidebar-link-icon">{link.icon}</span>
                    {link.label}
                  </span>
                  {link.badge && (
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                    }} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Organization Nav */}
        {selectedOrg && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section">
              <div className="sidebar-section-label">Organization</div>
              <ul className="sidebar-nav">
                {orgLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`sidebar-link ${pathname === link.href ? 'sidebar-link-active' : ''}`}
                    >
                      <span className="sidebar-link-icon">{link.icon}</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="sidebar-divider" />
        <div className="sidebar-section">
          <div className="sidebar-section-label">Manage</div>
          {orgs.length > 0 ? (
            <ul className="sidebar-nav sidebar-manage-orgs">
              {orgs.map((org) => {
                const orgPath = `/dashboard/org/${org.id}`
                const isActive = pathname.startsWith(orgPath) && selectedOrg?.id === org.id
                return (
                  <li key={org.id}>
                    <Link
                      href={orgPath}
                      className={`sidebar-link sidebar-manage-org-link ${isActive ? 'sidebar-link-active' : ''}`}
                      onClick={() => setSelectedOrg(org)}
                    >
                      <Avatar src={org.avatar_url} alt={org.name} size="xs" fallback="🏰" className="sidebar-manage-org-avatar" />
                      <span className="sidebar-manage-org-info">
                        <span className="sidebar-manage-org-name">{org.name}</span>
                        <span className="sidebar-manage-org-role">{org.role}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="sidebar-manage-empty">
              <span className="sidebar-manage-empty-text">No organizations yet</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {children}
      </div>
    </div>
  )
}
