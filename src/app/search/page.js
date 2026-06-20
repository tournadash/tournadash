'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ tournaments: [], organizations: [], users: [] })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    document.title = 'Search | TournaDash'
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults({ tournaments: [], organizations: [], users: [] })
      return
    }

    const timer = setTimeout(() => {
      performSearch(trimmed)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const performSearch = async (q) => {
    setLoading(true)
    try {
      const [t, o, u] = await Promise.all([
        supabase.from('tournaments').select('id, name, slug, status, player_count, organizations(name)').ilike('name', `%${q}%`).limit(10),
        supabase.from('organizations').select('id, name, slug, follower_count, tournament_count, avatar_url').ilike('name', `%${q}%`).limit(10),
        supabase.from('users').select('id, display_name, username, avatar_url, minecraft_ign').or(`display_name.ilike.%${q}%,username.ilike.%${q}%,minecraft_ign.ilike.%${q}%`).limit(10),
      ])

      setResults({
        tournaments: t.data || [],
        organizations: o.data || [],
        users: u.data || [],
      })
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
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
      case 'ONGOING': return 'Live'
      case 'SOON': return 'Soon'
      default: return 'Ended'
    }
  }

  const hasResults = results.tournaments.length > 0 || results.organizations.length > 0 || results.users.length > 0

  return (
    <div id="search-page" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 12, 21, 0.45) 0%, rgba(9, 12, 21, 1) 100%), url('/minecraft_arena_bg.png')`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            🔍 Search TournaDash
          </h1>
          <p className="page-header-banner-desc">
            Find tournaments, organizations, and players across the network.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Search Bar */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <Input
            id="search-input-field"
            placeholder="Type tournament name, organization, username or player IGN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ fontSize: 'var(--text-md)', padding: 'var(--space-4)' }}
          />
        </div>

        {/* Results */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <span className="btn-spinner" style={{ color: 'var(--color-primary)', display: 'inline-block', width: '24px', height: '24px' }} />
            <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>Searching network...</p>
          </div>
        )}

        {!loading && query.trim().length >= 2 && !hasResults && (
          <Card className="p-8 text-center">
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No results found for &quot;{query}&quot;</p>
          </Card>
        )}

        {!loading && query.trim().length < 2 && (
          <Card className="p-8 text-center">
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Type at least 2 characters to search...</p>
          </Card>
        )}

        {!loading && hasResults && (
          <div className="flex flex-col gap-8">
            {/* Tournaments */}
            {results.tournaments.length > 0 && (
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  Tournaments ({results.tournaments.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                  {results.tournaments.map(t => (
                    <Link key={t.id} href={`/tournaments/${t.slug}`} style={{ textDecoration: 'none' }}>
                      <Card interactive className="p-4 flex items-center justify-between">
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>{t.name}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>by {t.organizations?.name}</div>
                        </div>
                        <Badge variant={getStatusVariant(t.status)}>{getStatusLabel(t.status)}</Badge>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Organizations */}
            {results.organizations.length > 0 && (
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  Organizations ({results.organizations.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                  {results.organizations.map(o => (
                    <Link key={o.id} href={`/organizations/${o.slug}`} style={{ textDecoration: 'none' }}>
                      <Card interactive className="p-4 flex items-center gap-3">
                        <Avatar src={o.avatar_url} alt={o.name} size="sm" fallback={o.name[0]?.toUpperCase() || 'O'} />
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>{o.name}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>@{o.slug}</div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Players */}
            {results.users.length > 0 && (
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  Players ({results.users.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                  {results.users.map(u => (
                    <Link key={u.id} href={`/users/${u.username || u.id}`} style={{ textDecoration: 'none' }}>
                      <Card interactive className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.avatar_url} alt={u.display_name || u.username || 'User'} size="sm" fallback={u.display_name?.[0]?.toUpperCase() || 'U'} />
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>{u.display_name || u.username || 'User'}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                              {u.username ? `@${u.username}` : 'No username set'}
                            </div>
                          </div>
                        </div>
                        {u.minecraft_ign && (
                          <Badge variant="success" style={{ fontSize: '10px' }}>{u.minecraft_ign}</Badge>
                        )}
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
