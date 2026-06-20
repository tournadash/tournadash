'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function OrgTournamentsPage() {
  const { orgId } = useParams()
  const [tournaments, setTournaments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

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

      setLoading(false)
    }
    loadData()
  }, [orgId])

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="dashboard-page-header">
          <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '300px', height: '18px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className="skeleton" style={{ height: '300px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  return (
    <div id="org-tournaments-list-page" className="flex flex-col gap-8">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text flex items-center justify-between w-full">
          <div>
            <h1 className="dashboard-page-title">Organization Tournaments</h1>
            <p className="dashboard-page-subtitle">Manage, edit, and configure all tournaments hosted by this organization.</p>
          </div>
          {(userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
            <Link href={`/dashboard/org/${orgId}/tournaments/new`} className="btn btn-primary">
              + Create Tournament
            </Link>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '400px' }}>
        <Input
          placeholder="Search tournaments by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredTournaments.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredTournaments.map((t) => (
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
          <h4 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>No tournaments found</h4>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '360px', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
            {searchQuery ? 'Try adjusting your search query.' : 'Create your first tournament to get started.'}
          </p>
          {!searchQuery && (userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MANAGER') && (
            <Link href={`/dashboard/org/${orgId}/tournaments/new`} className="btn btn-primary">
              + Create Tournament
            </Link>
          )}
        </Card>
      )}
    </div>
  )
}
