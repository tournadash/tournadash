'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'

export default function OrgAllTournamentsPage() {
  const { slug } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [org, setOrg] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  // Search, Filter, Sort States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('CREATED_DESC')
  const [portalNode, setPortalNode] = useState(null)

  useEffect(() => {
    setPortalNode(document.getElementById('navbar-org-portal'))
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!orgData) {
        setLoading(false)
        return
      }
      setOrg(orgData)
      document.title = `${orgData.name} - Tournaments | TournaDash`

      const { data: tData } = await supabase
        .from('tournaments')
        .select('*')
        .eq('organization_id', orgData.id)
        .eq('is_private', false)
      setTournaments(tData || [])
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-10)' }}>
        <div className="skeleton" style={{ height: '80px', marginBottom: '24px', borderRadius: 'var(--radius-lg)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '240px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)' }}>
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
          <h1 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-white)' }}>Organization Not Found</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>This organization does not exist on the platform.</p>
          <Link href="/organizations">
            <Button variant="primary">Browse Organizations</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Filter & Sort Logic
  const getFilteredTournaments = () => {
    let list = [...tournaments]

    // Search
    if (search.trim()) {
      list = list.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter(t => t.status === statusFilter)
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'CREATED_DESC') {
        return new Date(b.created_at) - new Date(a.created_at)
      }
      if (sortBy === 'CREATED_ASC') {
        return new Date(a.created_at) - new Date(b.created_at)
      }
      if (sortBy === 'PLAYERS_DESC') {
        return (b.max_players || 0) - (a.max_players || 0)
      }
      if (sortBy === 'PLAYERS_ASC') {
        return (a.max_players || 0) - (b.max_players || 0)
      }
      if (sortBy === 'LIKES_DESC') {
        return (b.like_count || 0) - (a.like_count || 0)
      }
      if (sortBy === 'LIKES_ASC') {
        return (a.like_count || 0) - (b.like_count || 0)
      }
      return 0
    })

    return list
  }

  const filtered = getFilteredTournaments()

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
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      {/* Navbar Portal Injection */}
      {portalNode && createPortal(
        <div className="flex items-center gap-3">
          <Avatar src={org.avatar_url} alt={org.name} size="sm" />
          <span style={{ fontWeight: '800', display: 'flex', alignItems: 'center' }}>@{org.slug}</span>
        </div>,
        portalNode
      )}

      {/* Header Info */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/organizations/${org.slug}`}>
          <Avatar src={org.avatar_url} alt={org.name} size="md" fallback={org.name[0]?.toUpperCase() || 'O'} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '800', color: 'var(--color-text-white)', margin: 0 }}>
              {org.name}&apos;s Tournaments
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', margin: 0 }}>
            Back to <Link href={`/organizations/${org.slug}`} style={{ color: 'var(--color-primary)', fontWeight: '600' }}>@{org.slug} profile</Link>
          </p>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <Card className="p-4 mb-6" style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
        <div style={{
          display: 'flex',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left: Status Toggles */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'ONGOING', 'SOON', 'ENDED'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'ALL' ? 'All' : getStatusLabel(status)}
              </Button>
            ))}
          </div>

          {/* Right: Search Input & Sort Selection */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: '1', justifyContent: 'flex-end', minWidth: '280px' }}>
            <div style={{ width: '220px' }}>
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
              />
            </div>
            <div>
              <select
                className="td-input-field"
                style={{ height: '38px', padding: '0 var(--space-4)', fontSize: 'var(--text-xs)', width: '180px', backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="CREATED_DESC">Date: Newest</option>
                <option value="CREATED_ASC">Date: Oldest</option>
                <option value="PLAYERS_DESC">Players: Max to Min</option>
                <option value="PLAYERS_ASC">Players: Min to Max</option>
                <option value="LIKES_DESC">Likes: Top Rated</option>
                <option value="LIKES_ASC">Likes: Least Liked</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid of Results */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          {filtered.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.slug}`} style={{ textDecoration: 'none' }}>
              <Card interactive className="p-0 overflow-hidden gaming-glow-hover">
                {/* Banner Thumbnail */}
                <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
                  {t.banner_url ? (
                    <img src={t.banner_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-muted)', fontSize: '2rem' }}>
                      🎮
                    </div>
                  )}
                </div>

                <div style={{ padding: 'var(--space-5) var(--space-6) var(--space-6)' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
                    <h4 style={{ fontWeight: '700', color: 'var(--color-text-white)', fontSize: 'var(--text-md)', margin: 0 }}>
                      {t.name}
                    </h4>
                    <Badge variant={getStatusVariant(t.status)}>
                      {getStatusLabel(t.status)}
                    </Badge>
                  </div>

                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px', lineHeight: '1.5' }}>
                    {t.short_description || (t.description ? (t.description.length > 120 ? t.description.substring(0, 120) + '...' : t.description) : 'No description provided.')}
                  </p>

                  <div className="flex gap-4" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                    <span className="flex items-center gap-1">
                      👥 Max: {t.max_players || 'Unlimited'}
                    </span>
                    {t.likes_visible && (
                      <span className="flex items-center gap-1">
                        ❤️ {t.like_count || 0}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      📅 {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No tournaments found matching current search/filter settings.</p>
        </Card>
      )}
    </div>
  )
}
