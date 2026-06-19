'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'

function YouTubeEmbed({ url }) {
  if (!url) return null
  let videoId = ''
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) videoId = u.pathname.slice(1)
    else videoId = u.searchParams.get('v') || u.pathname.split('/').pop()
  } catch { return null }
  if (!videoId) return null

  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-6)' }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
        title="YouTube"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  )
}

export default function TournamentDetailPage() {
  const { slug } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [tournament, setTournament] = useState(null)
  const [org, setOrg] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [dislikeCount, setDislikeCount] = useState(0)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [followed, setFollowed] = useState(false)

  // Sprint 5 Registration states
  const [registration, setRegistration] = useState(null)
  const [registrationCount, setRegistrationCount] = useState(0)
  const [userProfile, setUserProfile] = useState(null)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [regStep, setRegStep] = useState(1) // 1 = check discord, 2 = IGN form
  const [discordVerifying, setDiscordVerifying] = useState(false)
  const [discordError, setDiscordError] = useState('')
  const [minecraftIgn, setMinecraftIgn] = useState('')
  const [submittingReg, setSubmittingReg] = useState(false)
  const [regError, setRegError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      const { data: t } = await supabase
        .from('tournaments')
        .select('*, organizations(id, name, slug, avatar_url, bio, social_youtube, social_discord, follower_count)')
        .eq('slug', slug)
        .single()

      if (!t) { setLoading(false); return }
      setTournament(t)
      document.title = `${t.name} | TournaDash`
      setOrg(t.organizations)
      setLikeCount(t.like_count || 0)
      setDislikeCount(t.dislike_count || 0)

      // Get comments
      const { data: c } = await supabase
        .from('comments')
        .select('*, users(display_name, username, avatar_url)')
        .eq('tournament_id', t.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setComments(c || [])

      // Fetch registrations count
      const { count: regCount } = await supabase
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', t.id)
      setRegistrationCount(regCount || 0)

      // Check user interactions
      if (u) {
        const { data: reaction } = await supabase
          .from('reactions')
          .select('type')
          .eq('tournament_id', t.id)
          .eq('user_id', u.id)
          .maybeSingle()
        if (reaction) {
          setLiked(reaction.type === 'LIKE')
          setDisliked(reaction.type === 'DISLIKE')
        }

        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('organization_id', t.organization_id)
          .eq('user_id', u.id)
          .maybeSingle()
        setFollowed(!!follow)

        // Fetch user profile info
        const { data: up } = await supabase
          .from('users')
          .select('discord_id, social_discord, minecraft_ign')
          .eq('id', u.id)
          .single()
        setUserProfile(up)
        if (up?.minecraft_ign) {
          setMinecraftIgn(up.minecraft_ign)
        }

        // Fetch registration if exists
        const { data: reg } = await supabase
          .from('tournament_registrations')
          .select('*')
          .eq('tournament_id', t.id)
          .eq('user_id', u.id)
          .maybeSingle()
        setRegistration(reg)
      }

      setLoading(false)
    }
    load()
  }, [slug])

  const handleReaction = async (type) => {
    if (!user) return
    const isActive = type === 'LIKE' ? liked : disliked

    if (isActive) {
      // Remove reaction
      await supabase.from('reactions').delete().eq('tournament_id', tournament.id).eq('user_id', user.id)
      if (type === 'LIKE') { setLiked(false); setLikeCount(c => c - 1) }
      else { setDisliked(false); setDislikeCount(c => c - 1) }
    } else {
      // Upsert reaction
      const wasLiked = liked, wasDisliked = disliked
      await supabase.from('reactions').upsert({
        tournament_id: tournament.id,
        user_id: user.id,
        type,
      }, { onConflict: 'tournament_id,user_id' })

      if (type === 'LIKE') {
        setLiked(true); setDisliked(false)
        setLikeCount(c => c + 1)
        if (wasDisliked) setDislikeCount(c => c - 1)
      } else {
        setDisliked(true); setLiked(false)
        setDislikeCount(c => c + 1)
        if (wasLiked) setLikeCount(c => c - 1)
      }
    }
  }

  const handleFollow = async () => {
    if (!user || !org) return
    if (followed) {
      await supabase.from('follows').delete().eq('organization_id', org.id).eq('user_id', user.id)
      setFollowed(false)
    } else {
      await supabase.from('follows').insert({ organization_id: org.id, user_id: user.id })
      setFollowed(true)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return
    setCommentLoading(true)

    const { data, error } = await supabase
      .from('comments')
      .insert({ tournament_id: tournament.id, user_id: user.id, body: newComment.trim() })
      .select('*, users(display_name, username, avatar_url)')
      .single()

    if (!error && data) {
      setComments([data, ...comments])
      setNewComment('')
    }
    setCommentLoading(false)
  }

  const deleteComment = async (commentId) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(comments.filter(c => c.id !== commentId))
  }

  const verifyDiscordMembership = async (forceUserDiscordId = null) => {
    const discordIdToCheck = forceUserDiscordId || userProfile?.discord_id
    if (!discordIdToCheck) {
      setDiscordError('Please link your Discord account first.')
      return
    }
    setDiscordVerifying(true)
    setDiscordError('')
    try {
      const res = await fetch(`/api/discord/check-member?guild_id=${tournament.discord_guild_id}&discord_id=${discordIdToCheck}`)
      if (!res.ok) throw new Error('API server returned error')
      const data = await res.json()
      if (data.isMember) {
        setRegStep(2)
      } else {
        setDiscordError('You are not a member of this tournament\'s Discord server. Please join first and then click verify again.')
      }
    } catch (err) {
      console.error(err)
      setDiscordError('Could not verify membership. Please make sure you have joined the server.')
    } finally {
      setDiscordVerifying(false)
    }
  }

  const handleRegisterClick = () => {
    if (!user) {
      router.push(`/login?redirect=/tournaments/${slug}`)
      return
    }

    setRegisterModalOpen(true)
    setRegError('')
    setDiscordError('')

    if (tournament.discord_guild_id) {
      setRegStep(1)
      if (userProfile?.discord_id) {
        verifyDiscordMembership()
      }
    } else {
      setRegStep(2)
    }
  }

  const handleLinkDiscordFromModal = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/tournaments/${slug}`,
          scopes: ['identify']
        }
      })
      if (error) throw error
    } catch (err) {
      setDiscordError(`Failed to link Discord: ${err.message}`)
    }
  }

  const handleSubmitRegistration = async (e) => {
    e.preventDefault()
    if (!minecraftIgn.trim()) {
      setRegError('Minecraft IGN is required.')
      return
    }
    setSubmittingReg(true)
    setRegError('')

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournament.id,
          user_id: user.id,
          minecraft_ign: minecraftIgn.trim(),
          discord_id: userProfile?.discord_id || null,
        })
        .select()
        .single()

      if (error) throw error

      setRegistration(data)
      setRegistrationCount(c => c + 1)
      setRegisterModalOpen(false)
    } catch (err) {
      setRegError(err.message || 'Failed to submit registration.')
    } finally {
      setSubmittingReg(false)
    }
  }

  const handleWithdrawRegistration = async () => {
    if (!window.confirm('Are you sure you want to withdraw your registration?')) return
    setSubmittingReg(true)
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id)

      if (error) throw error
      setRegistration(null)
      setRegistrationCount(c => Math.max(0, c - 1))
    } catch (err) {
      alert(`Failed to withdraw registration: ${err.message}`)
    } finally {
      setSubmittingReg(false)
    }
  }

  if (loading) {
    return (
      <div className="container animate-fade-in" style={{ paddingTop: 'var(--space-10)' }}>
        <div className="skeleton mb-4" style={{ height: '40px', width: '400px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton mb-8" style={{ height: '20px', width: '250px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton" style={{ height: '400px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="container text-center flex flex-col items-center justify-center gap-4" style={{ paddingTop: 'var(--space-16)' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>
          <svg viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1 className="dashboard-page-title">Tournament Not Found</h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '360px' }}>This tournament doesn&apos;t exist or has been removed.</p>
        <Link href="/tournaments" className="btn btn-primary">Browse Tournaments</Link>
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
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }} id="tournament-detail">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <Badge variant={getStatusVariant(tournament.status)}>
            {getStatusLabel(tournament.status)}
          </Badge>
          {tournament.starts_at && (
            <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {new Date(tournament.starts_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: '800', marginBottom: 'var(--space-4)' }}>
          {tournament.name}
        </h1>
        <div className="flex items-center gap-6 flex-wrap">
          <Link href={`/organizations/${org?.slug}`} className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <Avatar src={org?.avatar_url} alt={org?.name} size="sm" fallback="🏰" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: '600' }}>{org?.name}</span>
          </Link>
          <span className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            {tournament.player_count || 0} players
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Phase-Specific Content */}
          {tournament.status === 'SOON' && tournament.trailer_url && (
            <div>
              <h3 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-lg)' }}>Trailer</h3>
              <YouTubeEmbed url={tournament.trailer_url} />
            </div>
          )}

          {tournament.status === 'ONGOING' && tournament.stream_url && (
            <div>
              <h3 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-lg)' }}>Live Stream</h3>
              <YouTubeEmbed url={tournament.stream_url} />
            </div>
          )}

          {tournament.status === 'ENDED' && tournament.highlights_url && (
            <div>
              <h3 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-lg)' }}>Highlights</h3>
              <YouTubeEmbed url={tournament.highlights_url} />
            </div>
          )}

          {/* Winners (ENDED) */}
          {tournament.status === 'ENDED' && (tournament.winner_1st || tournament.winner_2nd || tournament.winner_3rd) && (
            <Card className="p-8 text-center">
              <h3 className="dashboard-page-title mb-6" style={{ fontSize: 'var(--text-base)' }}>Tournament Results</h3>
              <div className="flex justify-center gap-8 items-end">
                {tournament.winner_2nd && (
                  <div className="flex flex-col items-center">
                    <div style={{ fontSize: '32px', marginBottom: 'var(--space-2)' }}>🥈</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-text-white)' }}>{tournament.winner_2nd.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>2nd Place</div>
                  </div>
                )}
                {tournament.winner_1st && (
                  <div className="flex flex-col items-center">
                    <div style={{ fontSize: '44px', marginBottom: 'var(--space-2)' }}>🥇</div>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: '800', color: 'var(--color-warning)' }}>{tournament.winner_1st.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Champion</div>
                  </div>
                )}
                {tournament.winner_3rd && (
                  <div className="flex flex-col items-center">
                    <div style={{ fontSize: '32px', marginBottom: 'var(--space-2)' }}>🥉</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-text-white)' }}>{tournament.winner_3rd.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>3rd Place</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Description */}
          {tournament.description && (
            <Card className="p-6">
              <h3 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-base)' }}>About</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
                {tournament.description}
              </p>
            </Card>
          )}

          {/* Rules */}
          {tournament.rules && (
            <Card className="p-6">
              <h3 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-base)' }}>Rules</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
                {tournament.rules}
              </p>
            </Card>
          )}

          {/* Comments */}
          {tournament.comments_enabled && (
            <Card className="p-6">
              <h3 className="dashboard-page-title mb-6" style={{ fontSize: 'var(--text-base)' }}>Comments ({comments.length})</h3>

              {user ? (
                <form onSubmit={handleComment} className="flex gap-3 mb-6">
                  <Avatar size="sm" fallback="👤" />
                  <div style={{ flex: 1 }}>
                    <Input
                      type="textarea"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <Button type="submit" size="sm" loading={commentLoading} disabled={!newComment.trim()}>
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
                  <Link href="/login" style={{ color: 'var(--color-primary)' }}>Sign in</Link> to leave a comment.
                </p>
              )}

              {comments.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 items-start">
                      <Avatar src={c.users?.avatar_url} size="sm" fallback="👤" />
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/users/${c.users?.username}`} style={{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-text-white)', textDecoration: 'none' }}>
                            {c.users?.display_name || 'Anonymous'}
                          </Link>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                          {user && c.user_id === user.id && (
                            <button onClick={() => deleteComment(c.id)} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
                              Delete
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                          {c.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  No comments yet. Be the first!
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + var(--space-6))' }} className="flex flex-col gap-4">
          {/* Engagement */}
          <Card className="p-4">
            <div className="flex gap-3 w-full">
              <Button
                variant={liked ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleReaction('LIKE')}
                style={{ flex: 1 }}
                disabled={!user}
                className="flex items-center justify-center gap-1"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill={liked ? 'currentColor' : 'none'}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                {tournament.likes_visible ? likeCount : ''}
              </Button>
              {tournament.dislikes_visible && (
                <Button
                  variant={disliked ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => handleReaction('DISLIKE')}
                  style={{ flex: 1 }}
                  disabled={!user}
                  className="flex items-center justify-center gap-1"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill={disliked ? 'currentColor' : 'none'}>
                    <path d="M10 15v4a3 3 0 0 0 6 0v-4M2 10h20M12 2v8"></path>
                  </svg>
                  {dislikeCount}
                </Button>
              )}
            </div>
            {!user && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'var(--space-2)' }}>Sign in to react</p>}
          </Card>

          {/* Registration */}
          {tournament.status === 'SOON' && (
            <div className="flex flex-col gap-2">
              {tournament.registration_type === 'external' ? (
                tournament.registration_url ? (
                  <a href={tournament.registration_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg w-full flex items-center justify-center">
                    Register Now
                  </a>
                ) : (
                  <Button variant="secondary" size="lg" disabled className="w-full">
                    Registration Link Unavailable
                  </Button>
                )
              ) : (
                // Native Registration
                !user ? (
                  <Link href={`/login?redirect=/tournaments/${slug}`} className="btn btn-primary btn-lg w-full flex items-center justify-center" style={{ textDecoration: 'none' }}>
                    Sign In to Register
                  </Link>
                ) : registration ? (
                  <div className="flex flex-col gap-2">
                    <div className="p-3 text-center" style={{ backgroundColor: 'var(--color-primary-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: '600' }}>YOUR REGISTRATION STATUS</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text)', marginTop: '2px' }}>
                        {registration.status === 'REGISTERED' ? 'Pending Review' : registration.status === 'SELECTED' ? 'Whitelisted / Approved' : 'Rejected'}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>IGN: {registration.minecraft_ign}</div>
                    </div>
                    <Button variant="danger" onClick={handleWithdrawRegistration} loading={submittingReg} className="w-full">
                      Withdraw Registration
                    </Button>
                  </div>
                ) : !tournament.registration_open ? (
                  <Button variant="secondary" size="lg" disabled className="w-full">
                    Registration Closed
                  </Button>
                ) : tournament.max_registrations && registrationCount >= tournament.max_registrations ? (
                  <Button variant="secondary" size="lg" disabled className="w-full">
                    Registration Full
                  </Button>
                ) : (
                  <Button variant="primary" size="lg" onClick={handleRegisterClick} className="w-full">
                    Register for Tournament
                  </Button>
                )
              )}
            </div>
          )}

          {/* Info */}
          <Card className="p-5">
            <h4 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>Tournament Info</h4>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Status</span>
                <Badge variant={getStatusVariant(tournament.status)}>{tournament.status}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Whitelisted Players</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-text-white)' }}>
                  {tournament.player_count || 0}{tournament.max_players ? `/${tournament.max_players}` : ''}
                </span>
              </div>
              {tournament.registration_type === 'native' && (
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Registrants</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-text-white)' }}>
                    {registrationCount}{tournament.max_registrations ? `/${tournament.max_registrations}` : ''}
                  </span>
                </div>
              )}
              {tournament.starts_at && (
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Starts</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-white)' }}>{new Date(tournament.starts_at).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Created</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-white)' }}>{new Date(tournament.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          {/* Organization Card */}
          <Card className="p-5">
            <h4 className="dashboard-page-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>Organized by</h4>
            <Link href={`/organizations/${org?.slug}`} className="flex items-center gap-3 mb-4" style={{ textDecoration: 'none' }}>
              <Avatar src={org?.avatar_url} alt={org?.name} size="md" fallback="🏰" />
              <div>
                <div style={{ fontWeight: '600', color: 'var(--color-text-white)', fontSize: 'var(--text-sm)' }}>{org?.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{org?.follower_count || 0} followers</div>
              </div>
            </Link>
            <Button
              variant={followed ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleFollow}
              disabled={!user}
              className="w-full flex items-center justify-center gap-1"
            >
              {followed ? 'Following' : 'Follow'}
            </Button>
          </Card>
        </div>
      </div>

      {/* Native Registration Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Tournament Registration"
        size="md"
      >
        {regStep === 1 ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3" style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ color: '#5865F2' }}>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
              </svg>
              <div>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'block', color: 'var(--color-text)' }}>Discord Verification Required</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>This tournament checks if you are in the server before registering.</span>
              </div>
            </div>

            {!userProfile?.discord_id ? (
              <div className="flex flex-col gap-4 text-center py-4">
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  You must link a Discord account to your profile before registering.
                </p>
                <Button variant="primary" onClick={handleLinkDiscordFromModal}>
                  Link Discord Account
                </Button>
                {discordError && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{discordError}</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-4">
                {discordVerifying ? (
                  <div className="flex flex-col items-center gap-3">
                    <span className="btn-spinner" style={{ borderTopColor: 'var(--color-primary)' }} />
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Verifying your Discord server membership...</p>
                  </div>
                ) : discordError ? (
                  <div className="flex flex-col gap-4 text-center">
                    <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{discordError}</p>
                    {tournament.discord_invite_url && (
                      <a href={tournament.discord_invite_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline flex items-center justify-center gap-2">
                        Join Discord Server
                      </a>
                    )}
                    <Button variant="primary" onClick={() => verifyDiscordMembership()}>
                      Verify Membership Again
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitRegistration} className="flex flex-col gap-4">
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Complete your entry details below.
            </p>
            <Input
              label="Minecraft In-Game Name (IGN)"
              placeholder="e.g. Steve"
              value={minecraftIgn}
              onChange={(e) => setMinecraftIgn(e.target.value)}
              required
              helperText="Ensure this is exact, as it is used for whitelist access."
            />
            {regError && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{regError}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setRegisterModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submittingReg}>
                Complete Registration
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
