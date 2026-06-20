'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

export default function TournamentManagePage() {
  const { orgId, tournamentId } = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [newPlayerIgn, setNewPlayerIgn] = useState('')
  const [addPlayerLoading, setAddPlayerLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  // Sprint 5 Registrations states
  const [registrations, setRegistrations] = useState([])
  const [activeTab, setActiveTab] = useState('whitelist') // whitelist or registrations
  const [regSearch, setRegSearch] = useState('')

  const [serverIp, setServerIp] = useState('')
  const [ipRevealed, setIpRevealed] = useState(false)
  const [updatingIp, setUpdatingIp] = useState(false)

  // Whitelist Import States
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importLimitOption, setImportLimitOption] = useState('all')
  const [importLimitValue, setImportLimitValue] = useState('')
  const [importLoading, setImportLoading] = useState(false)

  const loadData = async () => {
    const { data: t } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()
    setTournament(t)

    const { data: p } = await supabase
      .from('tournament_players')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })
    setPlayers(p || [])

    // Fetch registrations
    const { data: regs } = await supabase
      .from('tournament_registrations')
      .select('*, users(display_name, username, avatar_url)')
      .eq('tournament_id', tournamentId)
      .order('registered_at', { ascending: false })
    setRegistrations(regs || [])

    // Fetch server IP
    const { data: ipData } = await supabase
      .from('tournament_server_ips')
      .select('*')
      .eq('tournament_id', tournamentId)
      .maybeSingle()
    setServerIp(ipData?.server_ip || '')
    setIpRevealed(!!ipData?.ip_revealed)

    setLoading(false)
  }

  useEffect(() => { loadData() }, [tournamentId])

  // Realtime subscription for whitelist and registration changes
  useEffect(() => {
    const playerChannel = supabase
      .channel('tournament-players')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_players',
        filter: `tournament_id=eq.${tournamentId}`,
      }, () => { loadData() })
      .subscribe()

    const regChannel = supabase
      .channel('tournament-regs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_registrations',
        filter: `tournament_id=eq.${tournamentId}`,
      }, () => { loadData() })
      .subscribe()

    return () => {
      supabase.removeChannel(playerChannel)
      supabase.removeChannel(regChannel)
    }
  }, [tournamentId])

  const copyToken = () => {
    navigator.clipboard.writeText(tournament.server_token)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  const runAutoFillPromotion = async (tObj = tournament) => {
    if (!tObj || !tObj.auto_fill || !tObj.auto_select_count) return

    // Count current SELECTED
    const { count: selectedCount } = await supabase
      .from('tournament_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId)
      .eq('status', 'SELECTED')

    const needed = tObj.auto_select_count - (selectedCount || 0)
    if (needed <= 0) return

    // Fetch the next oldest pending registrations
    const { data: nextRegs } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('status', 'REGISTERED')
      .order('registered_at', { ascending: true })
      .limit(needed)

    if (nextRegs && nextRegs.length > 0) {
      const { data: { user } } = await supabase.auth.getUser()
      for (const reg of nextRegs) {
        await supabase
          .from('tournament_registrations')
          .update({ status: 'SELECTED' })
          .eq('id', reg.id)

        await supabase
          .from('tournament_players')
          .insert({
            tournament_id: tournamentId,
            minecraft_ign: reg.minecraft_ign,
            added_by: user?.id,
            added_via: 'web'
          })
      }
      // Reload states
      const { data: t } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single()
      setTournament(t)
      const { data: p } = await supabase.from('tournament_players').select('*').eq('tournament_id', tournamentId).order('created_at', { ascending: false })
      setPlayers(p || [])
      const { data: regs } = await supabase.from('tournament_registrations').select('*, users(display_name, username, avatar_url)').eq('tournament_id', tournamentId).order('registered_at', { ascending: false })
      setRegistrations(regs || [])
    }
  }

  const changeStatus = async (newStatus) => {
    setStatusUpdating(true)
    const updateData = { status: newStatus }

    const { error } = await supabase
      .from('tournaments')
      .update(updateData)
      .eq('id', tournamentId)

    if (!error) {
      setTournament(prev => ({ ...prev, status: newStatus }))
      setSuccess(`Tournament status changed to ${newStatus}`)
      setTimeout(() => setSuccess(''), 3000)
    }
    setStatusUpdating(false)
  }

  const addPlayer = async (e) => {
    e.preventDefault()
    if (!newPlayerIgn.trim()) return
    setAddPlayerLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertError } = await supabase
      .from('tournament_players')
      .insert({
        tournament_id: tournamentId,
        minecraft_ign: newPlayerIgn.trim(),
        added_by: user?.id,
        added_via: 'web',
      })

    if (insertError) {
      if (insertError.message.includes('duplicate')) {
        setError('This player is already on the whitelist.')
      } else {
        setError(insertError.message)
      }
    } else {
      setNewPlayerIgn('')
      loadData()
    }
    setAddPlayerLoading(false)
  }

  const removePlayer = async (playerId, ign) => {
    if (!confirm(`Remove ${ign} from the whitelist?`)) return
    await supabase.from('tournament_players').delete().eq('id', playerId)
    await supabase
      .from('tournament_registrations')
      .update({ status: 'REGISTERED' })
      .eq('tournament_id', tournamentId)
      .ilike('minecraft_ign', ign)

    const { data: currentT } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single()
    await runAutoFillPromotion(currentT)
  }

  const toggleBan = async (playerId, currentBan) => {
    await supabase.from('tournament_players').update({ is_banned: !currentBan }).eq('id', playerId)
    loadData()
  }

  const updateStreamUrl = async (url) => {
    await supabase.from('tournaments').update({ stream_url: url }).eq('id', tournamentId)
  }

  const updateHighlightsUrl = async (url) => {
    await supabase.from('tournaments').update({ highlights_url: url }).eq('id', tournamentId)
  }

  const saveWinners = async (place, data) => {
    const field = place === 1 ? 'winner_1st' : place === 2 ? 'winner_2nd' : 'winner_3rd'
    await supabase.from('tournaments').update({ [field]: data }).eq('id', tournamentId)
    setSuccess('Winners saved!')
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleDeleteTournament = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete this tournament? This will permanently delete all whitelists, registrations, and comments. This action cannot be undone.')) return
    const verification = window.prompt('Please type the tournament name to confirm deletion:')
    if (verification !== tournament.name) {
      alert('Tournament name did not match. Deletion cancelled.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId)

      if (error) throw error

      setSuccess('Tournament deleted successfully.')
      setTimeout(() => {
        router.push(`/dashboard/org/${orgId}`)
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(`Failed to delete tournament: ${err.message}`)
      setSaving(false)
    }
  }

  const handleApproveRegistration = async (reg) => {
    const { error: updateError } = await supabase
      .from('tournament_registrations')
      .update({ status: 'SELECTED' })
      .eq('id', reg.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error: playerError } = await supabase
      .from('tournament_players')
      .insert({
        tournament_id: tournamentId,
        minecraft_ign: reg.minecraft_ign,
        added_by: user?.id,
        added_via: 'web'
      })

    if (playerError && !playerError.message.includes('duplicate')) {
      setError(playerError.message)
    } else {
      setSuccess(`Approved ${reg.minecraft_ign} and added to whitelist.`)
      setTimeout(() => setSuccess(''), 3000)
    }

    loadData()
  }

  const handleRejectRegistration = async (reg) => {
    const { error: updateError } = await supabase
      .from('tournament_registrations')
      .update({ status: 'REJECTED' })
      .eq('id', reg.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await supabase
      .from('tournament_players')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('minecraft_ign', reg.minecraft_ign)

    setSuccess(`Rejected registration for ${reg.minecraft_ign}.`)
    setTimeout(() => setSuccess(''), 3000)

    const { data: currentT } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single()
    await runAutoFillPromotion(currentT)
  }

  const parseMinecraftNames = (text) => {
    if (!text) return []
    const regex = /[a-zA-Z0-9_]{3,16}/g
    const matches = text.match(regex) || []
    const names = []
    const seen = new Set()
    for (const match of matches) {
      if (!/^\d+$/.test(match)) {
        const lower = match.toLowerCase()
        if (!seen.has(lower)) {
          names.push(match)
          seen.add(lower)
        }
      }
    }
    return names
  }

  const handleImportWhitelist = async (e) => {
    e.preventDefault()
    const parsedNames = parseMinecraftNames(importText)
    if (parsedNames.length === 0) {
      alert('No valid player names found in the text.')
      return
    }

    setImportLoading(true)
    setError('')
    setSuccess('')

    try {
      const existingWhitelistedSet = new Set(players.map(p => p.minecraft_ign.toLowerCase()))
      let namesToWhitelist = parsedNames.filter(name => !existingWhitelistedSet.has(name.toLowerCase()))

      if (importLimitOption === 'limit') {
        const limit = parseInt(importLimitValue)
        if (!isNaN(limit) && limit > 0) {
          namesToWhitelist = namesToWhitelist.slice(0, limit)
        }
      }

      if (namesToWhitelist.length === 0) {
        alert('All parsed players are already whitelisted.')
        setImportLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      const insertRows = namesToWhitelist.map(ign => ({
        tournament_id: tournamentId,
        minecraft_ign: ign,
        added_by: user?.id,
        added_via: 'web'
      }))

      const { error: insertError } = await supabase
        .from('tournament_players')
        .insert(insertRows)

      if (insertError) throw insertError

      setSuccess(`Successfully whitelisted ${namesToWhitelist.length} players.`)
      setTimeout(() => setSuccess(''), 3000)
      setImportModalOpen(false)
      setImportText('')
      loadData()
    } catch (err) {
      setError(`Failed to import players: ${err.message}`)
    } finally {
      setImportLoading(false)
    }
  }

  const handleResetRegistration = async (reg) => {
    const { error: updateError } = await supabase
      .from('tournament_registrations')
      .update({ status: 'REGISTERED' })
      .eq('id', reg.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await supabase
      .from('tournament_players')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('minecraft_ign', reg.minecraft_ign)

    const { data: currentT } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single()
    await runAutoFillPromotion(currentT)
  }

  const handleBulkApprove = async () => {
    const targets = filteredRegs.filter(reg => reg.status !== 'SELECTED')
    if (targets.length === 0) return
    if (!confirm(`Approve all ${targets.length} matching registrants?`)) return
    
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    for (const reg of targets) {
      await supabase
        .from('tournament_registrations')
        .update({ status: 'SELECTED' })
        .eq('id', reg.id)
        
      await supabase
        .from('tournament_players')
        .insert({
          tournament_id: tournamentId,
          minecraft_ign: reg.minecraft_ign,
          added_by: user?.id,
          added_via: 'web'
        })
    }
    
    setSuccess(`Bulk approved ${targets.length} registrations.`)
    setTimeout(() => setSuccess(''), 3000)
    setSaving(false)
    loadData()
  }

  const handleBulkReject = async () => {
    const targets = filteredRegs.filter(reg => reg.status !== 'REJECTED')
    if (targets.length === 0) return
    if (!confirm(`Reject all ${targets.length} matching registrants?`)) return
    
    setSaving(true)
    
    for (const reg of targets) {
      await supabase
        .from('tournament_registrations')
        .update({ status: 'REJECTED' })
        .eq('id', reg.id)
        
      await supabase
        .from('tournament_players')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('minecraft_ign', reg.minecraft_ign)
    }
    
    setSuccess(`Bulk rejected ${targets.length} registrations.`)
    setTimeout(() => setSuccess(''), 3000)
    setSaving(false)
    loadData()
  }

  const filteredRegs = registrations.filter(r => 
    r.minecraft_ign.toLowerCase().includes(regSearch.toLowerCase()) || 
    r.users?.display_name?.toLowerCase().includes(regSearch.toLowerCase()) ||
    r.users?.username?.toLowerCase().includes(regSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="dashboard-page-header">
          <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '300px', height: '18px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className="dashboard-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '120px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
        <div style={{ color: 'var(--color-text-muted)' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>Tournament not found</h2>
        <Link href={`/dashboard/org/${orgId}`} className="btn btn-primary">Back to Org Dashboard</Link>
      </Card>
    )
  }

  return (
    <div id="tournament-manage-page" className="flex flex-col gap-8">
      {/* Header */}
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="dashboard-page-title">{tournament.name}</h1>
            <Badge variant={tournament.status === 'ONGOING' ? 'success' : tournament.status === 'SOON' ? 'primary' : 'neutral'}>
              {tournament.status}
            </Badge>
          </div>
          <p className="dashboard-page-subtitle">
            Manage whitelist, status, and results for this tournament.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/org/${orgId}/tournaments/${tournamentId}/edit`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Edit Details
          </Link>
          <Link href={`/tournaments/${tournament.slug}`} className="btn btn-secondary btn-sm" target="_blank" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            View Public Page
          </Link>
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

      {/* Status & Token Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Status Control */}
        <Card className="p-6">
          <h4 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-base)' }}>Tournament Phase</h4>
          <div className="flex gap-3">
            {[
              { status: 'SOON', icon: (
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              )},
              { status: 'ONGOING', icon: (
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )},
              { status: 'ENDED', icon: (
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
              )},
            ].map(({ status, icon }) => (
              <Button
                key={status}
                variant={tournament.status === status ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => changeStatus(status)}
                disabled={statusUpdating || tournament.status === status}
                className="flex items-center gap-1.5"
              >
                {icon}
                {status}
              </Button>
            ))}
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
            {tournament.status === 'SOON' && 'Players cannot join the server. Registration is open.'}
            {tournament.status === 'ONGOING' && 'Only whitelisted players can join. Registration closed.'}
            {tournament.status === 'ENDED' && 'Server is locked. Tournament results can be set.'}
          </p>
        </Card>

        {/* Server Token */}
        <Card className="p-6">
          <h4 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-base)' }}>Server Token</h4>
          <div className="flex gap-2">
            <input
              className="td-input-field"
              value={tournament.server_token}
              readOnly
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', flex: 1 }}
            />
            <Button variant="secondary" size="sm" onClick={copyToken}>
              {tokenCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
            Paste this into your plugin&apos;s <code style={{ color: 'var(--color-primary)' }}>config.yml</code>
          </p>
        </Card>
      </div>

      {/* Server IP Direct Control */}
      <Card className="p-6">
        <h4 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-base)' }}>Minecraft Server Connection</h4>
        <div className="flex gap-4 items-center">
          <div style={{ flex: 1 }}>
            <label className="td-input-label">Minecraft Server IP</label>
            <input
              className="td-input-field"
              value={serverIp}
              placeholder="e.g. play.mydomain.com (leave blank to clear)"
              onChange={(e) => setServerIp(e.target.value)}
              style={{ fontSize: 'var(--text-sm)' }}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer" style={{ marginTop: '22px' }}>
            <input
              type="checkbox"
              checked={ipRevealed}
              onChange={(e) => setIpRevealed(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-white)' }}>Reveal IP to Whitelisted Participants</span>
          </label>
          <Button
            variant="primary"
            size="sm"
            style={{ marginTop: '22px' }}
            loading={updatingIp}
            onClick={async () => {
              setUpdatingIp(true)
              if (serverIp.trim()) {
                await supabase
                  .from('tournament_server_ips')
                  .upsert({
                    tournament_id: tournamentId,
                    server_ip: serverIp.trim(),
                    ip_revealed: ipRevealed
                  })
              } else {
                await supabase
                  .from('tournament_server_ips')
                  .delete()
                  .eq('tournament_id', tournamentId)
              }
              setSuccess('Server IP settings updated!')
              setTimeout(() => setSuccess(''), 2000)
              setUpdatingIp(false)
            }}
          >
            Save Connection Settings
          </Button>
        </div>
      </Card>

      {/* Stream URL (show when ONGOING) */}
      {tournament.status === 'ONGOING' && (
        <Card className="p-6">
          <h4 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-base)' }}>Live Stream URL</h4>
          <Input
            type="url"
            placeholder="https://youtube.com/live/..."
            defaultValue={tournament.stream_url || ''}
            onBlur={(e) => updateStreamUrl(e.target.value)}
            helperText="YouTube Live stream URL — displayed on the public tournament page"
          />
        </Card>
      )}

      {/* Winners (show when ENDED) */}
      {tournament.status === 'ENDED' && (
        <Card className="p-6 flex flex-col gap-6">
          <h4 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)' }}>Tournament Results</h4>
          <div className="grid grid-cols-3 gap-6">
            {[
              { place: 1, label: 'First Place', color: 'var(--color-warning)' },
              { place: 2, label: 'Second Place', color: 'var(--color-text-secondary)' },
              { place: 3, label: 'Third Place', color: '#cd7f32' },
            ].map(({ place, label, color }) => (
              <div key={place}>
                <label className="td-input-label" style={{ color }}>{label}</label>
                <input
                  className="td-input-field"
                  placeholder="Player or team name"
                  defaultValue={tournament[`winner_${place === 1 ? '1st' : place === 2 ? '2nd' : '3rd'}`]?.name || ''}
                  onBlur={(e) => saveWinners(place, { name: e.target.value })}
                />
              </div>
            ))}
          </div>
          <Input
            label="Highlights / VOD URL"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            defaultValue={tournament.highlights_url || ''}
            onBlur={(e) => updateHighlightsUrl(e.target.value)}
          />
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1px' }}>
        <button
          onClick={() => setActiveTab('whitelist')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'whitelist' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'whitelist' ? 'var(--color-text-white)' : 'var(--color-text-secondary)',
            fontWeight: '600',
            fontSize: 'var(--text-sm)',
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Whitelist Management
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'registrations' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'registrations' ? 'var(--color-text-white)' : 'var(--color-text-secondary)',
            fontWeight: '600',
            fontSize: 'var(--text-sm)',
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Registrations ({registrations.length})
        </button>
      </div>

      {activeTab === 'whitelist' ? (
        /* Whitelist Management */
        <Card className="p-6 flex flex-col gap-6">
          <div>
            <h4 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)' }}>Whitelist ({players.filter(p => !p.is_banned).length} players)</h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {tournament.whitelist_enabled ? 'Whitelist is ENABLED — only listed players can join' : 'Whitelist is DISABLED — only org members can join'}
            </p>
          </div>

          {/* Add Player */}
          <div className="flex gap-2 w-full">
            <form onSubmit={addPlayer} className="flex gap-2" style={{ flex: 1 }}>
              <input
                className="td-input-field"
                placeholder="Enter Minecraft IGN..."
                value={newPlayerIgn}
                onChange={(e) => setNewPlayerIgn(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button type="submit" size="sm" loading={addPlayerLoading}>
                Add Player
              </Button>
            </form>
            <Button variant="secondary" size="sm" onClick={() => setImportModalOpen(true)}>
              Import Whitelist
            </Button>
          </div>

          {/* Players Table */}
          {players.length > 0 ? (
            <div className="flex flex-col gap-2">
              {/* Header */}
              <div className="flex items-center" style={{
                padding: '0 var(--space-4)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600',
                height: '32px'
              }}>
                <span style={{ flex: 2 }}>Player IGN</span>
                <span style={{ flex: 1 }}>Added Via</span>
                <span style={{ flex: 1 }}>Status</span>
                <span style={{ flex: 1 }}>Date</span>
                <span style={{ width: '120px', textAlign: 'right' }}>Actions</span>
              </div>

              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center"
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    backgroundColor: player.is_banned ? 'var(--color-danger-subtle)' : 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    height: '48px'
                  }}
                >
                  <span style={{ flex: 2, fontWeight: '600', color: player.is_banned ? 'var(--color-danger)' : 'var(--color-text-white)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                    {player.minecraft_ign}
                  </span>
                  <span style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {player.added_via === 'web' ? '🌐 Web' : player.added_via === 'plugin' ? '🎮 Plugin' : '🔌 API'}
                  </span>
                  <span style={{ flex: 1 }}>
                    <Badge variant={player.is_banned ? 'danger' : 'success'}>
                      {player.is_banned ? 'Banned' : 'Active'}
                    </Badge>
                  </span>
                  <span style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {new Date(player.created_at).toLocaleDateString()}
                  </span>
                  <div style={{ width: '120px', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: player.is_banned ? 'var(--color-primary)' : 'var(--color-warning)', padding: '0 var(--space-2)', height: '28px' }}
                      onClick={() => toggleBan(player.id, player.is_banned)}
                    >
                      {player.is_banned ? 'Unban' : 'Ban'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: 'var(--color-danger)', padding: '0 var(--space-2)', height: '28px' }}
                      onClick={() => removePlayer(player.id, player.minecraft_ign)}
                    >
                      &times;
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }} className="flex flex-col items-center gap-2">
              <div style={{ color: 'var(--color-text-muted)' }}>
                <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--color-text-white)' }}>No players whitelisted yet.</p>
              <p style={{ fontSize: 'var(--text-xs)' }}>Add players above or use <code style={{ color: 'var(--color-primary)' }}>/tw add &lt;player&gt;</code> in-game.</p>
            </div>
          )}
        </Card>
      ) : (
        /* Registrations Management */
        <Card className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)' }}>Manage Registrations</h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Review player sign-ups, check their linked Discord accounts, and approve/reject whitelist access.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkApprove} disabled={saving || filteredRegs.length === 0}>
                Bulk Approve
              </Button>
              <Button variant="danger" size="sm" onClick={handleBulkReject} disabled={saving || filteredRegs.length === 0}>
                Bulk Reject
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <input
              className="td-input-field"
              placeholder="Search by IGN or display name..."
              value={regSearch}
              onChange={(e) => setRegSearch(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          {filteredRegs.length > 0 ? (
            <div className="flex flex-col gap-2">
              {/* Header */}
              <div className="flex items-center" style={{
                padding: '0 var(--space-4)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600',
                height: '32px'
              }}>
                <span style={{ flex: 2 }}>Player IGN / Account</span>
                <span style={{ flex: 1.5 }}>Discord Info</span>
                <span style={{ flex: 1 }}>Status</span>
                <span style={{ flex: 1 }}>Registered At</span>
                <span style={{ width: '180px', textAlign: 'right' }}>Actions</span>
              </div>

              {filteredRegs.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center"
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    backgroundColor: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    minHeight: '56px'
                  }}
                >
                  <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar src={reg.users?.avatar_url} size="sm" fallback="👤" />
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--color-text-white)', fontSize: 'var(--text-sm)' }}>
                        {reg.minecraft_ign}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {reg.users?.display_name} (@{reg.users?.username})
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column' }}>
                    {reg.discord_id ? (
                      <>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-white)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="#5865F2">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
                          </svg>
                          Linked
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>ID: {reg.discord_id}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Not Linked</span>
                    )}
                  </div>

                  <span style={{ flex: 1 }}>
                    <Badge variant={reg.status === 'SELECTED' ? 'success' : reg.status === 'REJECTED' ? 'danger' : 'primary'}>
                      {reg.status === 'SELECTED' ? 'Approved' : reg.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                    </Badge>
                  </span>

                  <span style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {new Date(reg.registered_at).toLocaleDateString()}
                  </span>

                  <div style={{ width: '180px', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    {reg.status !== 'SELECTED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--color-primary)', padding: '0 var(--space-2)', height: '28px' }}
                        onClick={() => handleApproveRegistration(reg)}
                      >
                        Approve
                      </Button>
                    )}
                    {reg.status !== 'REJECTED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--color-danger)', padding: '0 var(--space-2)', height: '28px' }}
                        onClick={() => handleRejectRegistration(reg)}
                      >
                        Reject
                      </Button>
                    )}
                    {(reg.status === 'SELECTED' || reg.status === 'REJECTED') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--color-text-secondary)', padding: '0 var(--space-2)', height: '28px' }}
                        onClick={() => handleResetRegistration(reg)}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }} className="flex flex-col items-center gap-2">
              <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--color-text-white)' }}>No matching registrations found.</p>
            </div>
          )}
        </Card>
      )}

      {/* Danger Zone */}
      <Card style={{ borderColor: 'rgba(239, 68, 68, 0.25)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }} className="p-6">
        <h4 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', color: 'var(--color-danger)', marginBottom: '8px' }}>Danger Zone</h4>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Deleting the tournament is a permanent action. All registrations, whitelist records, comment threads, and tournament details will be deleted immediately.
        </p>
        <Button variant="danger" size="sm" onClick={handleDeleteTournament} loading={saving}>
          Delete Tournament
        </Button>
      </Card>
      {/* Import Whitelist Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Whitelist from Text"
        size="md"
      >
        <form onSubmit={handleImportWhitelist} className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Paste a list of players. Ranks, numbers, commas, or bullet points (e.g. <code>1. player</code>, <code>player, player</code>) will be parsed automatically.
          </p>
          
          <textarea
            className="td-input-field"
            placeholder="Paste your player list here..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            style={{ minHeight: '150px', fontSize: 'var(--text-sm)', padding: '10px', width: '100%', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)' }}
            required
          />

          {importText.trim() && (
            <div className="p-3" style={{ backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: '600' }}>PARSER PREVIEW</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-white)', marginTop: '4px' }}>
                Parsed <strong>{parseMinecraftNames(importText).length}</strong> unique players:
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', marginTop: '4px', maxHeight: '60px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                {parseMinecraftNames(importText).join(', ')}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="input-label" style={{ marginBottom: '4px' }}>Whitelist Options</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--color-text-white)' }}>
                <input
                  type="radio"
                  name="import_limit_option"
                  value="all"
                  checked={importLimitOption === 'all'}
                  onChange={() => setImportLimitOption('all')}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                Whitelist all parsed players
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--color-text-white)' }}>
                <input
                  type="radio"
                  name="import_limit_option"
                  value="limit"
                  checked={importLimitOption === 'limit'}
                  onChange={() => setImportLimitOption('limit')}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span>Whitelist only the first</span>
                <input
                  type="number"
                  className="td-input-field"
                  placeholder="e.g. 10"
                  value={importLimitValue}
                  onChange={(e) => setImportLimitValue(e.target.value)}
                  disabled={importLimitOption !== 'limit'}
                  style={{ width: '80px', height: '24px', padding: '0 8px', fontSize: 'var(--text-xs)', display: 'inline-block', margin: '0 4px' }}
                  min="1"
                />
                <span>players</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={importLoading} disabled={!importText.trim()}>
              Start Whitelisting
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
