'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'

export default function LeaderboardPage() {
  const [orgs, setOrgs] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [tab, setTab] = useState('orgs')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    document.title = 'Leaderboard | TournaDash'
    const load = async () => {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .order('follower_count', { ascending: false })
        .limit(25)
      setOrgs(orgData || [])

      const { data: tData } = await supabase
        .from('tournaments')
        .select('*, organizations(name, slug, avatar_url)')
        .order('like_count', { ascending: false })
        .limit(25)
      setTournaments(tData || [])

      setLoading(false)
    }
    load()
  }, [])

  const getRankBadge = (index) => {
    const rank = index + 1
    if (rank === 1) {
      return (
        <span style={{ fontSize: '1.4rem', lineHeight: '1' }}>🥇</span>
      )
    }
    if (rank === 2) {
      return (
        <span style={{ fontSize: '1.4rem', lineHeight: '1' }}>🥈</span>
      )
    }
    if (rank === 3) {
      return (
        <span style={{ fontSize: '1.4rem', lineHeight: '1' }}>🥉</span>
      )
    }
    return <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontWeight: '600', paddingLeft: '6px' }}>#{rank}</span>
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ONGOING': return 'success'
      case 'SOON': return 'primary'
      default: return 'neutral'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ONGOING': return 'Live Now'
      case 'SOON': return 'Coming Soon'
      default: return 'Ended'
    }
  }

  return (
    <div id="leaderboard-page" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 12, 21, 0.45) 0%, rgba(9, 12, 21, 1) 100%), url('/minecraft_leaderboard_bg.png')`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            👑 Leaderboard & Champions
          </h1>
          <p className="page-header-banner-desc">
            Top organizations and most popular tournaments.
          </p>
        </div>
      </div>

      <div className="container">

      {/* Tabs */}
      <div className="flex justify-center gap-2" style={{ marginBottom: 'var(--space-8)' }}>
        <Button variant={tab === 'orgs' ? 'primary' : 'secondary'} onClick={() => setTab('orgs')}>
          Top Organizations 🏰
        </Button>
        <Button variant={tab === 'tournaments' ? 'primary' : 'secondary'} onClick={() => setTab('tournaments')}>
          Popular Tournaments 🏆
        </Button>
      </div>

      {loading ? (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: '72px', marginBottom: '8px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : tab === 'orgs' ? (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Table Header */}
          <div className="flex items-center" style={{
            padding: 'var(--space-3) var(--space-5)',
            fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600',
          }}>
            <span style={{ width: '60px' }}>Rank</span>
            <span style={{ flex: 1 }}>Organization</span>
            <span style={{ width: '100px', textAlign: 'center' }}>Tournaments</span>
            <span style={{ width: '100px', textAlign: 'center' }}>Followers</span>
          </div>

          {orgs.map((org, i) => (
            <Link key={org.id} href={`/organizations/${org.slug}`} style={{ textDecoration: 'none' }}>
              <Card interactive className="mb-2 gaming-glow-hover" style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '60px', display: 'flex', alignItems: 'center' }}>
                  {getRankBadge(i)}
                </span>
                <div className="flex items-center gap-3" style={{ flex: 1 }}>
                  <Avatar
                    src={org.avatar_url}
                    alt={org.name}
                    size="sm"
                    fallback={org.name[0]?.toUpperCase() || 'O'}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>{org.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>@{org.slug}</div>
                  </div>
                </div>
                <span style={{ width: '100px', textAlign: 'center', fontWeight: '600', color: 'var(--color-text-white)' }}>
                  {org.tournament_count || 0}
                </span>
                <span style={{ width: '100px', textAlign: 'center', fontWeight: '700', color: 'var(--color-primary)' }}>
                  {org.follower_count || 0}
                </span>
              </Card>
            </Link>
          ))}

          {orgs.length === 0 && (
            <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
              <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No organizations yet. Be the first!</p>
            </Card>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Table Header */}
          <div className="flex items-center" style={{
            padding: 'var(--space-3) var(--space-5)',
            fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600',
          }}>
            <span style={{ width: '60px' }}>Rank</span>
            <span style={{ flex: 1 }}>Tournament</span>
            <span style={{ width: '100px', textAlign: 'center' }}>Status</span>
            <span style={{ width: '80px', textAlign: 'center' }}>Players</span>
            <span style={{ width: '80px', textAlign: 'center' }}>Likes</span>
          </div>

          {tournaments.map((t, i) => (
            <Link key={t.id} href={`/tournaments/${t.slug}`} style={{ textDecoration: 'none' }}>
              <Card interactive className="mb-2 gaming-glow-hover" style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '60px', display: 'flex', alignItems: 'center' }}>
                  {getRankBadge(i)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>{t.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>by {t.organizations?.name}</div>
                </div>
                <span style={{ width: '100px', textAlign: 'center' }}>
                  <Badge variant={getStatusVariant(t.status)} style={{ fontSize: '9px' }}>
                    {getStatusLabel(t.status)}
                  </Badge>
                </span>
                <span style={{ width: '80px', textAlign: 'center', fontWeight: '600', color: 'var(--color-text-white)' }}>
                  {t.player_count || 0}
                </span>
                <span className="flex items-center justify-center gap-1" style={{ width: '80px', fontWeight: '700', color: 'var(--color-danger)' }}>
                  ❤️ {t.like_count || 0}
                </span>
              </Card>
            </Link>
          ))}

          {tournaments.length === 0 && (
            <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
              <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No tournaments yet.</p>
            </Card>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
