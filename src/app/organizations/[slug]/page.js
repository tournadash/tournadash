'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'

export default function OrgPublicProfilePage() {
  const { slug } = useParams()
  const supabase = createClient()
  const [org, setOrg] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [members, setMembers] = useState([])
  const [user, setUser] = useState(null)
  const [followed, setFollowed] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      const { data: orgData } = await supabase.from('organizations').select('*').eq('slug', slug).single()
      if (!orgData) { setLoading(false); return }
      setOrg(orgData)
      document.title = `${orgData.name} | TournaDash`
      setFollowerCount(orgData.follower_count || 0)

      const { data: t } = await supabase.from('tournaments').select('*').eq('organization_id', orgData.id).eq('is_private', false).order('created_at', { ascending: false })
      setTournaments(t || [])

      const { data: m } = await supabase.from('organization_members').select('*, users(display_name, username, avatar_url)').eq('organization_id', orgData.id)
      setMembers(m || [])

      // Fetch organization leaderboard
      const { data: lbData } = await supabase
        .from('organization_leaderboards')
        .select('*')
        .eq('organization_id', orgData.id)
        .order('wins', { ascending: false })
        .limit(10)

      if (lbData && lbData.length > 0) {
        setLeaderboard(lbData)
      } else {
        // Fallback: calculate dynamically from ended tournaments
        const calc = {}
        t?.forEach(tourney => {
          if (tourney.status === 'ENDED' && tourney.winner_1st?.name) {
            const name = tourney.winner_1st.name.trim()
            calc[name] = (calc[name] || 0) + 1
          }
        })
        const calculatedLB = Object.entries(calc)
          .map(([name, wins]) => ({ player_name: name, wins }))
          .sort((a, b) => b.wins - a.wins)
          .slice(0, 10)
        setLeaderboard(calculatedLB)
      }

      if (u) {
        const { data: follow } = await supabase.from('follows').select('id').eq('organization_id', orgData.id).eq('user_id', u.id).maybeSingle()
        setFollowed(!!follow)
      }

      setLoading(false)
    }
    load()
  }, [slug])

  const handleFollow = async () => {
    if (!user) return
    if (followed) {
      await supabase.from('follows').delete().eq('organization_id', org.id).eq('user_id', user.id)
      setFollowed(false)
      setFollowerCount(c => c - 1)
    } else {
      await supabase.from('follows').insert({ organization_id: org.id, user_id: user.id })
      setFollowed(true)
      setFollowerCount(c => c + 1)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-10)' }}>
        <div className="skeleton" style={{ height: '200px', marginBottom: '32px', borderRadius: 'var(--radius-lg)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)' }}>
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
          <div style={{ color: 'var(--color-text-muted)' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', marginBottom: 0, color: 'var(--color-text-white)' }}>Organization Not Found</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>This organization does not exist on the platform.</p>
          <Link href="/organizations">
            <Button variant="primary">Browse Organizations</Button>
          </Link>
        </Card>
      </div>
    )
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
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }} id="org-public-profile">
      {/* Header Card */}
      <Card className="p-8 mb-8" style={{ borderTop: '4px solid var(--color-primary)' }}>
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <Avatar
              src={org.avatar_url}
              alt={org.name}
              size="xl"
              fallback={org.name[0]?.toUpperCase() || 'O'}
            />
            <div>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: '800', marginBottom: 'var(--space-1)' }}>
                {org.name}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                @{org.slug}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {org.social_discord && (
              <a href={org.social_discord} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  Discord
                </Button>
              </a>
            )}
            {org.social_youtube && (
              <a href={org.social_youtube} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  YouTube
                </Button>
              </a>
            )}
            <Button
              variant={followed ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleFollow}
              disabled={!user || members.some(m => m.user_id === user.id)}
            >
              {members.some(m => m.user_id === user?.id) ? 'Member' : (followed ? 'Following' : 'Follow')}
            </Button>
          </div>
        </div>

        {org.bio && (
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)', lineHeight: 'var(--leading-relaxed)', maxWidth: '700px' }}>
            {org.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-8" style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--color-border)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--color-text-white)' }}>{followerCount}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Followers</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--color-text-white)' }}>{tournaments.length}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Tournaments</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--color-text-white)' }}>{members.length}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Team Members</div>
          </div>
        </div>
      </Card>

      {/* Custom Links (Linktree) */}
      {org.custom_links && org.custom_links.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          {org.custom_links.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Card interactive className="p-4 text-center">
                <span className="flex items-center justify-center gap-2" style={{ fontWeight: '500', color: 'var(--color-primary)', fontSize: 'var(--text-sm)' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  {link.label}
                </span>
              </Card>
            </a>
          ))}
        </div>
      )}

      {/* Team Members */}
      <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)', color: 'var(--color-text-white)' }}>Team Members</h3>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-10)' }}>
        {members.map((m) => (
          <Link key={m.id} href={`/users/${m.users?.username || m.user_id}`} style={{ textDecoration: 'none' }}>
            <Card interactive className="flex items-center gap-3" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <Avatar
                src={m.users?.avatar_url}
                alt={m.users?.display_name || ''}
                size="sm"
                fallback={m.users?.display_name?.[0]?.toUpperCase() || 'U'}
              />
              <div>
                <div style={{ fontWeight: '500', fontSize: 'var(--text-sm)', color: 'var(--color-text-white)' }}>
                  {m.users?.display_name}
                </div>
                <Badge variant={m.role === 'OWNER' ? 'danger' : m.role === 'MANAGER' ? 'primary' : 'neutral'} style={{ fontSize: '9px', padding: '1px 4px', marginTop: '2px' }}>
                  {m.role}
                </Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Leaderboard Section */}
      {leaderboard && leaderboard.length > 0 && (
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)', color: 'var(--color-text-white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏆 Organization Leaderboard</span>
          </h3>
          <Card className="p-6">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              {leaderboard.map((player, idx) => {
                const rank = idx + 1
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontWeight: '800',
                        fontSize: 'var(--text-sm)',
                        color: rank === 1 ? 'var(--color-warning)' : rank === 2 ? 'var(--color-text-secondary)' : rank === 3 ? '#cd7f32' : 'var(--color-text-muted)',
                        width: '20px'
                      }}>
                        #{rank}
                      </span>
                      <span style={{ fontWeight: '600', color: 'var(--color-text-white)', fontSize: 'var(--text-sm)' }}>
                        {player.player_name}
                      </span>
                    </div>
                    <Badge variant="primary" style={{ fontSize: '10px' }}>
                      {player.wins} {player.wins === 1 ? 'Win' : 'Wins'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Tournaments */}
      <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)', color: 'var(--color-text-white)' }}>Tournaments</h3>
      {tournaments.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
          {tournaments.map((t) => {
            return (
              <Link key={t.id} href={`/tournaments/${t.slug}`} style={{ textDecoration: 'none' }}>
                <Card interactive className="p-0 overflow-hidden">
                  {/* Thumbnail Image */}
                  <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
                    {t.banner_url ? (
                      <img src={t.banner_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
                        <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 'var(--space-5) var(--space-6) var(--space-6)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
                      <h4 style={{ fontWeight: '600', color: 'var(--color-text-white)', fontSize: 'var(--text-md)' }}>
                        {t.name}
                      </h4>
                      <Badge variant={getStatusVariant(t.status)}>
                        {getStatusLabel(t.status)}
                      </Badge>
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px' }}>
                      {t.short_description || (t.description ? (t.description.length > 120 ? t.description.substring(0, 120) + '...' : t.description) : 'No description provided.')}
                    </p>
                    <div className="flex gap-4" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        {t.player_count || 0}
                      </span>
                      {t.likes_visible && (
                        <span className="flex items-center gap-1">
                          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          {t.like_count || 0}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {new Date(t.created_at).toLocaleDateString()}
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
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No tournaments hosted yet.</p>
        </Card>
      )}
    </div>
  )
}
