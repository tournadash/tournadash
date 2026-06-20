'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

export default function OrgLeaderboardDashboardPage() {
  const { orgId } = useParams()
  const supabase = createClient()
  
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState([])
  const [endedTournaments, setEndedTournaments] = useState([])
  const [calculatedWins, setCalculatedWins] = useState({})
  
  // Form states
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newWins, setNewWins] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  
  // Message states
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to access this page.')
        setLoading(false)
        return
      }

      // 1. Verify User Role in organization
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!memberData) {
        setUserRole(null)
        setLoading(false)
        return
      }

      setUserRole(memberData.role)

      // Only OWNER and ADMIN are allowed to access/manage
      if (memberData.role !== 'OWNER' && memberData.role !== 'ADMIN') {
        setLoading(false)
        return
      }

      // 2. Fetch Leaderboard Entries
      const { data: lbData } = await supabase
        .from('organization_leaderboards')
        .select('*')
        .eq('organization_id', orgId)
        .order('wins', { ascending: false })
      
      setLeaderboard(lbData || [])

      // 3. Fetch Ended Tournaments & Calculate Wins
      const { data: tData } = await supabase
        .from('tournaments')
        .select('id, name, winner_1st')
        .eq('organization_id', orgId)
        .eq('status', 'ENDED')

      setEndedTournaments(tData || [])

      const calc = {}
      tData?.forEach(t => {
        const winnerName = t.winner_1st?.name
        if (winnerName && winnerName.trim()) {
          const cleanName = winnerName.trim()
          calc[cleanName] = (calc[cleanName] || 0) + 1
        }
      })
      setCalculatedWins(calc)

    } catch (err) {
      setError(`Failed to load data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [orgId])

  const handleAddEntry = async (e) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const cleanName = newPlayerName.trim()
      const winsCount = parseInt(newWins, 10) || 1

      const { error: insertError } = await supabase
        .from('organization_leaderboards')
        .insert({
          organization_id: orgId,
          player_name: cleanName,
          wins: winsCount
        })

      if (insertError) {
        if (insertError.message.includes('unique')) {
          throw new Error('This player is already on the leaderboard. Please edit their score instead.')
        }
        throw insertError
      }

      setNewPlayerName('')
      setNewWins(1)
      setSuccess(`Added ${cleanName} to the leaderboard.`)
      setTimeout(() => setSuccess(''), 3000)
      
      // Reload leaderboard list
      const { data: lbData } = await supabase
        .from('organization_leaderboards')
        .select('*')
        .eq('organization_id', orgId)
        .order('wins', { ascending: false })
      setLeaderboard(lbData || [])

    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateWins = async (id, currentWins, change) => {
    const newCount = Math.max(1, currentWins + change)
    if (newCount === currentWins) return

    setError('')
    try {
      const { error: updateError } = await supabase
        .from('organization_leaderboards')
        .update({ wins: newCount })
        .eq('id', id)

      if (updateError) throw updateError

      setLeaderboard(prev => prev.map(item => item.id === id ? { ...item, wins: newCount } : item).sort((a, b) => b.wins - a.wins))
    } catch (err) {
      setError(`Failed to update score: ${err.message}`)
    }
  }

  const handleDeleteEntry = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from the leaderboard?`)) return
    
    setError('')
    try {
      const { error: deleteError } = await supabase
        .from('organization_leaderboards')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setLeaderboard(prev => prev.filter(item => item.id !== id))
      setSuccess(`Removed ${name} from the leaderboard.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to delete entry: ${err.message}`)
    }
  }

  const handleSyncTournaments = async () => {
    const calculatedList = Object.entries(calculatedWins)
    if (calculatedList.length === 0) {
      alert("No tournament winners found from ended tournaments of this organization.")
      return
    }

    if (!confirm(`This will sync wins for ${calculatedList.length} players found in ended tournaments. Existing entries' win counts will be updated if they differ. Proceed?`)) {
      return
    }

    setSyncing(true)
    setError('')
    setSuccess('')

    try {
      const upsertData = calculatedList.map(([name, wins]) => ({
        organization_id: orgId,
        player_name: name,
        wins: wins
      }))

      const { error: upsertError } = await supabase
        .from('organization_leaderboards')
        .upsert(upsertData, { onConflict: 'organization_id,player_name' })

      if (upsertError) throw upsertError

      setSuccess('Successfully synced leaderboard entries with ended tournaments!')
      setTimeout(() => setSuccess(''), 4000)

      // Reload leaderboard list
      const { data: lbData } = await supabase
        .from('organization_leaderboards')
        .select('*')
        .eq('organization_id', orgId)
        .order('wins', { ascending: false })
      setLeaderboard(lbData || [])

    } catch (err) {
      setError(`Failed to sync: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="skeleton" style={{ width: '200px', height: '32px', borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
        <div style={{ color: 'var(--color-danger)' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h2 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>Access Denied</h2>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
          You do not have permission to manage the leaderboard. Only the Owner and Admins of this organization can access this page.
        </p>
      </Card>
    )
  }

  return (
    <div id="org-leaderboard-manage" className="flex flex-col gap-8">
      {/* Header */}
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Manage Organization Leaderboard</h1>
          <p className="dashboard-page-subtitle">
            Create standings of top players who won tournaments hosted by this organization.
          </p>
        </div>
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncTournaments}
            disabled={syncing || Object.keys(calculatedWins).length === 0}
            className="flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Sync from Finished Tournaments ({Object.keys(calculatedWins).length} winners)
          </Button>
        </div>
      </div>

      {success && (
        <div className="auth-success" style={{ marginBottom: 0 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="auth-error" style={{ marginBottom: 0 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left Column: Entries List */}
        <Card className="p-6">
          <h3 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-base)' }}>Leaderboard Standings</h3>
          {leaderboard.length > 0 ? (
            <div className="flex flex-col gap-2">
              {/* Table Header */}
              <div className="flex items-center" style={{
                padding: '0 var(--space-4)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600',
                height: '32px'
              }}>
                <span style={{ width: '40px' }}>Rank</span>
                <span style={{ flex: 2 }}>Player Username / IGN</span>
                <span style={{ flex: 1, textAlign: 'center' }}>Tournament Wins</span>
                <span style={{ width: '120px', textAlign: 'right' }}>Actions</span>
              </div>

              {/* Rows */}
              {leaderboard.map((item, index) => {
                const rank = index + 1
                return (
                  <div
                    key={item.id}
                    className="flex items-center animate-fade-in"
                    style={{
                      padding: 'var(--space-2) var(--space-4)',
                      backgroundColor: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      height: '52px'
                    }}
                  >
                    <span style={{ 
                      width: '40px', 
                      fontWeight: '800', 
                      color: rank === 1 ? 'var(--color-warning)' : rank === 2 ? 'var(--color-text-secondary)' : rank === 3 ? '#cd7f32' : 'var(--color-text-muted)',
                      fontSize: 'var(--text-sm)'
                    }}>
                      #{rank}
                    </span>
                    <span style={{ flex: 2, fontWeight: '600', color: 'var(--color-text-white)', fontSize: 'var(--text-sm)' }}>
                      {item.player_name}
                    </span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0 8px', height: '24px', minWidth: 'auto', fontSize: '10px' }}
                        onClick={() => handleUpdateWins(item.id, item.wins, -1)}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: '800', color: 'var(--color-text-white)', minWidth: '24px', textAlign: 'center', fontSize: 'var(--text-sm)' }}>
                        {item.wins}
                      </span>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0 8px', height: '24px', minWidth: 'auto', fontSize: '10px' }}
                        onClick={() => handleUpdateWins(item.id, item.wins, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ width: '120px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleDeleteEntry(item.id, item.player_name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-danger)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-secondary)' }} className="flex flex-col items-center gap-2">
              <div>🏆</div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--color-text-white)' }}>Leaderboard is empty.</p>
              <p style={{ fontSize: 'var(--text-xs)' }}>Add entries manually using the form or sync with finished tournaments.</p>
            </div>
          )}
        </Card>

        {/* Right Column: Add Entry Form & Sync Summary */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h3 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-base)' }}>Add Player Manually</h3>
            <form onSubmit={handleAddEntry} className="flex flex-col gap-4">
              <Input
                label="Player Minecraft IGN"
                placeholder="e.g. Dream, Steve"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                required
              />
              <Input
                label="Number of Wins"
                type="number"
                min="1"
                value={newWins}
                onChange={(e) => setNewWins(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" loading={submitting} disabled={!newPlayerName.trim()} className="w-full">
                Add to Leaderboard
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h3 className="dashboard-page-title mb-2" style={{ fontSize: 'var(--text-base)' }}>Tournament Integration</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: '1.4' }}>
              We detected <strong>{endedTournaments.length}</strong> finished tournaments for this organization.
            </p>
            {Object.keys(calculatedWins).length > 0 ? (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2)' }}>
                {Object.entries(calculatedWins).map(([name, wins]) => (
                  <div key={name} className="flex justify-between items-center py-1 px-2" style={{ fontSize: 'var(--text-xs)', borderBottom: '1px solid var(--color-border)', lastBorder: 'none' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>{name}</span>
                    <Badge variant="neutral">{wins} {wins === 1 ? 'win' : 'wins'}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                No winners found. Set 1st place winners on finished tournaments first.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
