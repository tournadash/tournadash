'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import useScrollAnimation from '@/hooks/useScrollAnimation'
import TournamentCard from '@/components/ui/TournamentCard'

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
  const [userRegistrations, setUserRegistrations] = useState({}) // tournament_id -> registration status
  
  useScrollAnimation('.animate-on-scroll', [loading, org, members, tournaments, leaderboard, userRegistrations])

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
        
        // Fetch user's registrations for these tournaments
        if (t && t.length > 0) {
          const tIds = t.map(tourn => tourn.id)
          const { data: regs } = await supabase
            .from('tournament_registrations')
            .select('tournament_id, status')
            .eq('user_id', u.id)
            .in('tournament_id', tIds)
            
          if (regs) {
            const regMap = {}
            regs.forEach(r => { regMap[r.tournament_id] = r })
            setUserRegistrations(regMap)
          }
        }
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
      <Card className="p-0 mb-8 overflow-hidden relative animate-on-scroll">
        {/* Banner Area */}
        <div style={{
          height: '200px',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: org.banner_url ? 'none' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)'
        }}>
          {org.banner_url && (
            <img
              src={org.banner_url}
              alt={`${org.name} Banner`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>

        {/* Content Area */}
        <div className="p-8" style={{ position: 'relative' }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6" style={{ marginTop: '-75px', marginBottom: 'var(--space-4)' }}>
            <div className="flex items-end gap-5 flex-wrap md:flex-nowrap">
              <div style={{
                borderRadius: 'var(--radius-full)',
                border: '4px solid var(--color-bg-card)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                backgroundColor: 'var(--color-bg-card)',
                display: 'inline-flex',
                flexShrink: 0
              }}>
                <Avatar
                  src={org.avatar_url}
                  alt={org.name}
                  size="xl"
                  fallback={org.name[0]?.toUpperCase() || 'O'}
                />
              </div>
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: '800', marginBottom: 'var(--space-1)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {org.name}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
                  @{org.slug}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-2)' }}>
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
        </div>
      </Card>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }} className="animate-on-scroll">
        
        {/* Left Column: Featured Events & Announcements */}
        <div className="flex flex-col gap-8">
          
          {/* Featured Events */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4)',
              borderBottom: '2px solid var(--color-border)',
              paddingBottom: '8px'
            }}>
              <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-white)', margin: 0, fontWeight: '800' }}>FEATURED EVENTS</h3>
              {tournaments.length > 0 && (
                <Link
                  href={`/organizations/${slug}/tournaments`}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 'var(--text-xs)', textDecoration: 'none', padding: '6px 12px', fontWeight: '800' }}
                >
                  VIEW ALL ➔
                </Link>
              )}
            </div>

            {tournaments.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
                {tournaments.filter(t => t.status !== 'ENDED').slice(0, 4).map((t) => (
                  <TournamentCard key={t.id} tournament={t} userRegistration={userRegistrations[t.id]} />
                ))}
                {/* Fallback to ended tournaments if no active ones exist */}
                {tournaments.filter(t => t.status !== 'ENDED').length === 0 && tournaments.slice(0, 2).map((t) => (
                  <TournamentCard key={t.id} tournament={t} userRegistration={userRegistrations[t.id]} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No tournaments hosted yet.</p>
              </Card>
            )}
          </div>

          {/* Announcements / Bio Box */}
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-white)', margin: 0, fontWeight: '800', marginBottom: 'var(--space-4)', borderBottom: '2px solid var(--color-border)', paddingBottom: '8px' }}>
              ANNOUNCEMENTS
            </h3>
            <Card className="p-6" style={{ border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              {org.bio ? (
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {org.bio}
                </p>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>No current announcements.</p>
              )}
            </Card>
          </div>
        </div>

        {/* Right Column: Highlights & Handles */}
        <div className="flex flex-col gap-8">
          
          {/* Recent Highlights */}
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-white)', margin: 0, fontWeight: '800', marginBottom: 'var(--space-4)', borderBottom: '2px solid var(--color-border)', paddingBottom: '8px' }}>
              RECENT HIGHLIGHTS
            </h3>
            {tournaments.filter(t => t.status === 'ENDED').length > 0 ? (
              <div className="flex flex-col gap-4">
                {tournaments.filter(t => t.status === 'ENDED').slice(0, 3).map(t => (
                  <Card key={t.id} interactive className="p-4" style={{ border: '2px solid var(--color-border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '800', marginBottom: '4px' }}>
                      {new Date(t.ends_at || t.created_at).toLocaleDateString()}
                    </div>
                    <Link href={`/tournaments/${t.slug}`} style={{ fontWeight: '700', color: 'var(--color-text-white)', textDecoration: 'none', display: 'block', marginBottom: '4px' }}>
                      {t.name}
                    </Link>
                    {t.winner_1st && (
                      <div style={{ fontSize: '12px', color: 'var(--color-warning)', fontWeight: '600' }}>
                        🏆 Champion: {t.winner_1st.name}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center" style={{ border: '2px dashed var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No recent highlights.</p>
              </Card>
            )}
          </div>

          {/* Community Handles */}
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-white)', margin: 0, fontWeight: '800', marginBottom: 'var(--space-4)', borderBottom: '2px solid var(--color-border)', paddingBottom: '8px' }}>
              COMMUNITY
            </h3>
            <div className="flex flex-col gap-3">
              {org.social_discord && (
                <a href={org.social_discord} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{ 
                    width: '100%', padding: '12px', backgroundColor: '#5865F2', color: 'white', fontWeight: '800', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
                  }}>
                    JOIN DISCORD ➔
                  </button>
                </a>
              )}
              {org.social_youtube && (
                <a href={org.social_youtube} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{ 
                    width: '100%', padding: '12px', backgroundColor: '#FF0000', color: 'white', fontWeight: '800', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
                  }}>
                    WATCH ON YOUTUBE ➔
                  </button>
                </a>
              )}
              {org.custom_links && org.custom_links.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{ 
                    width: '100%', padding: '12px', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-white)', fontWeight: '800', border: '2px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
                  }}>
                    {link.label.toUpperCase()} ➔
                  </button>
                </a>
              ))}
            </div>
          </div>
          
          {/* Leaderboard/Team Box */}
          {leaderboard && leaderboard.length > 0 && (
             <div>
              <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-white)', margin: 0, fontWeight: '800', marginBottom: 'var(--space-4)', borderBottom: '2px solid var(--color-border)', paddingBottom: '8px' }}>
                TOP PLAYERS
              </h3>
              <Card className="p-0" style={{ border: '2px solid var(--color-border)', overflow: 'hidden' }}>
                {leaderboard.map((player, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < leaderboard.length - 1 ? '1px solid var(--color-border)' : 'none', backgroundColor: idx % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-subtle)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: '800', color: idx === 0 ? 'var(--color-warning)' : idx === 1 ? 'var(--color-text-secondary)' : idx === 2 ? '#cd7f32' : 'var(--color-text-muted)' }}>
                        #{idx + 1}
                      </span>
                      <span style={{ fontWeight: '700', color: 'var(--color-text-white)' }}>{player.player_name}</span>
                    </div>
                    <Badge variant="primary" style={{ fontWeight: '800' }}>{player.wins} WINS</Badge>
                  </div>
                ))}
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

