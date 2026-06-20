'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function MyTournamentsPage() {
  const [joinedTournaments, setJoinedTournaments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get all registered tournaments (no filters on status)
      const { data: regList } = await supabase
        .from('tournament_registrations')
        .select(`
          id,
          minecraft_ign,
          status,
          registered_at,
          tournaments (
            id, name, slug, status, starts_at, ends_at,
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

        setJoinedTournaments(regList.map(r => ({
          ...r,
          serverIpInfo: ipMap[r.tournaments?.id] || null
        })))
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCancelRegistration = async (regId, tournamentName) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for "${tournamentName}"?`)) return
    
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('id', regId)

      if (error) throw error

      setJoinedTournaments(prev => prev.filter(r => r.id !== regId))
      alert('Registration cancelled successfully.')
    } catch (err) {
      alert(`Failed to cancel registration: ${err.message}`)
    }
  }

  const filteredTournaments = joinedTournaments.filter((reg) => {
    const t = reg.tournaments
    if (!t) return false
    return t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (t.organizations?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  })

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

  return (
    <div id="my-tournaments-page" className="flex flex-col gap-8">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">My Tournaments</h1>
          <p className="dashboard-page-subtitle">View and manage your registered, active, and past tournament history.</p>
        </div>
      </div>

      <div style={{ maxWidth: '400px' }}>
        <Input
          placeholder="Search by tournament name or organization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredTournaments.length > 0 ? (
        <div className="dashboard-grid">
          {filteredTournaments.map((reg) => {
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
                        onClick={() => handleCancelRegistration(reg.id, t.name)}
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
            No tournaments found. Browse the <Link href="/tournaments" style={{ color: 'var(--color-primary)' }}>Tournaments page</Link> to sign up!
          </p>
        </Card>
      )}
    </div>
  )
}
