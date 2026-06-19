'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'

export default function OrganizationsBrowsePage() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    document.title = 'Browse Organizations | TournaDash'
    const load = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .order('follower_count', { ascending: false })
      setOrgs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div id="organizations-browse" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* Immersive Scenic Header Banner */}
      <div 
        className="page-header-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(9, 12, 21, 0.45) 0%, rgba(9, 12, 21, 1) 100%), url('/minecraft_castle_bg.png')`
        }}
      >
        <div className="page-header-banner-content">
          <h1 className="page-header-banner-title text-gradient-primary">
            🏰 Browse Organizations
          </h1>
          <p className="page-header-banner-desc">
            Discover tournament organizers and follow your favorites.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Search bar */}
      <div style={{ maxWidth: '400px', margin: '0 auto var(--space-8)' }}>
        <Input
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          {filtered.map((org) => (
            <Link key={org.id} href={`/organizations/${org.slug}`} style={{ textDecoration: 'none' }}>
              <Card interactive className="p-6 gaming-glow-hover">
                <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-4)' }}>
                  <Avatar
                    src={org.avatar_url}
                    alt={org.name}
                    size="lg"
                    fallback={org.name[0]?.toUpperCase() || 'O'}
                  />
                  <div>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--color-text-white)' }}>
                      {org.name}
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      @{org.slug}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px' }}>
                  {org.bio || 'No bio provided.'}
                </p>

                <div className="flex gap-6" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                  <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    🎮 {org.tournament_count || 0} tournaments
                  </span>
                  <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    👥 {org.follower_count || 0} followers
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
          <div style={{ color: 'var(--color-text-muted)', fontSize: '3rem' }}>
            🔍
          </div>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 0, color: 'var(--color-text-white)' }}>No organizations found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>Try a different search term.</p>
        </Card>
      )}
      </div>
    </div>
  )
}
