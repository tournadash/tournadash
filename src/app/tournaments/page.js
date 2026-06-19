'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'

export default function TournamentsBrowsePage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    document.title = 'Browse Tournaments | TournaDash'
    const load = async () => {
      let query = supabase
        .from('tournaments')
        .select('*, organizations(name, slug, avatar_url)')
        .order('created_at', { ascending: false })

      if (filter !== 'ALL') {
        query = query.eq('status', filter)
      }

      const { data } = await query
      setTournaments(data || [])
      setLoading(false)
    }
    load()
  }, [filter])

  const filtered = tournaments.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.organizations?.name?.toLowerCase().includes(search.toLowerCase())
  )

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
    <div id="tournaments-browse" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 12, 21, 0.4) 0%, rgba(9, 12, 21, 1) 100%), url('/minecraft_arena_bg.png')`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            🏆 Browse Tournaments
          </h1>
          <p className="page-header-banner-desc">
            Find and join Minecraft tournaments from organizations around the world.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {['ALL', 'SOON', 'ONGOING', 'ENDED'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : getStatusLabel(f)}
            </Button>
          ))}
        </div>
        <div style={{ maxWidth: '300px', width: '100%' }}>
          <Input
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="dashboard-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: '220px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
          {filtered.map((t) => {
            return (
              <Link
                key={t.id}
                href={`/tournaments/${t.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <Card interactive className="p-0 overflow-hidden gaming-glow-hover">
                  {/* Thumbnail Image */}
                  <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
                    {t.banner_url ? (
                      <img src={t.banner_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-muted)', fontSize: '2rem' }}>
                        🎮
                      </div>
                    )}
                  </div>

                  {/* Status Banner */}
                  <div style={{
                    padding: 'var(--space-3) var(--space-6)',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <Badge variant={getStatusVariant(t.status)}>
                      {getStatusLabel(t.status)}
                    </Badge>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      👥 {t.player_count || 0} players
                    </span>
                  </div>

                  <div style={{ padding: 'var(--space-5) var(--space-6) var(--space-6)' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-2)', color: 'var(--color-text-white)' }}>
                      {t.name}
                    </h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px' }}>
                      {t.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Avatar src={t.organizations?.avatar_url} alt={t.organizations?.name || 'Org'} size="sm" fallback="🏰" />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                          {t.organizations?.name || 'Unknown'}
                        </span>
                      </div>
                      {t.starts_at && (
                        <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          📅 {new Date(t.starts_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Engagement */}
                    <div className="flex gap-4" style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                      {t.likes_visible && (
                        <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          ❤️ {t.like_count || 0}
                        </span>
                      )}
                      <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        💬 {t.comment_count || 0}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
          <div style={{ color: 'var(--color-text-muted)', fontSize: '3rem' }}>
            🔍
          </div>
          <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>No tournaments found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {search ? 'Try a different search term.' : 'No tournaments available in this category yet.'}
          </p>
        </Card>
      )}
      </div>
    </div>
  )
}
