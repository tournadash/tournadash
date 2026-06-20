'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function UserPublicProfilePage() {
  const { username } = useParams()
  const supabase = createClient()
  const [profile, setProfile] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [stats, setStats] = useState({ played: 0, wins: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      let query = supabase.from('users').select('*')
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(username)) {
        query = query.or(`id.eq.${username},username.ilike.${username}`)
      } else {
        query = query.ilike('username', username)
      }

      const { data: user } = await query.maybeSingle()

      if (!user) {
        setLoading(false)
        return
      }
      setProfile(user)
      document.title = `${user.display_name || user.username} | TournaDash`

      const { data: memberships } = await supabase
        .from('organization_members')
        .select('role, organizations(id, name, slug, avatar_url, follower_count, tournament_count)')
        .eq('user_id', user.id)
      setOrgs(memberships?.map(m => ({ ...m.organizations, role: m.role })) || [])

      // Fetch user statistics
      if (user.minecraft_ign) {
        // Tournaments Played (selected in whitelist)
        const { count: playedCount } = await supabase
          .from('tournament_players')
          .select('*', { count: 'exact', head: true })
          .ilike('minecraft_ign', user.minecraft_ign)

        // Tournaments Won (1st place)
        const { count: wonCount } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ENDED')
          .ilike('winner_1st->>name', user.minecraft_ign)

        setStats({
          played: playedCount || 0,
          wins: wonCount || 0
        })
      } else {
        setStats({ played: 0, wins: 0 })
      }

      setLoading(false)
    }
    load()
  }, [username])

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-10)' }}>
        <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)' }}>
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
          <div style={{ color: 'var(--color-text-muted)' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', marginBottom: 0, color: 'var(--color-text-white)' }}>User Not Found</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>This user does not exist on the platform.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: '700px' }} id="user-profile">
      {/* Profile Card */}
      <Card className="p-8 text-center mb-8" style={{ borderTop: '4px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          <Avatar
            src={profile.avatar_url}
            alt={profile.display_name || profile.username}
            size="xl"
            fallback={profile.display_name?.[0]?.toUpperCase() || 'U'}
          />
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '800', marginBottom: 'var(--space-1)', color: 'var(--color-text-white)' }}>
          {profile.display_name || profile.username}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          @{profile.username || `user_${profile.id.substring(0, 8)}`}
        </p>

        {profile.minecraft_ign && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Badge variant="success" style={{ fontSize: 'var(--text-xs)', padding: '4px 12px' }}>
              IGN: {profile.minecraft_ign}
            </Badge>
          </div>
        )}

        {/* Statistics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-4)',
          maxWidth: '300px',
          margin: 'var(--space-5) auto var(--space-5) auto',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--color-bg-input)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: '800', color: 'var(--color-text-white)' }}>
              {stats.played}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px', fontWeight: '700' }}>
              Played
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: '800', color: 'var(--color-warning)' }}>
              {stats.wins}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px', fontWeight: '700' }}>
              Won
            </div>
          </div>
        </div>

        {profile.bio && (
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', maxWidth: '500px', margin: '0 auto' }}>
            {profile.bio}
          </p>
        )}

        {/* Social Links */}
        {(profile.social_youtube || profile.social_discord || profile.social_twitch) && (
          <div className="flex justify-center flex-wrap gap-3" style={{ marginTop: 'var(--space-5)' }}>
            {profile.social_youtube && (
              <a href={profile.social_youtube} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  YouTube
                </Button>
              </a>
            )}

            {profile.social_twitch && (
              <a href={profile.social_twitch} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  Twitch
                </Button>
              </a>
            )}
          </div>
        )}

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-6)' }}>
          Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </Card>

      {/* Organizations */}
      {orgs.length > 0 && (
        <>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)', color: 'var(--color-text-white)' }}>
            Organizations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {orgs.map((org) => (
              <Link key={org.id} href={`/organizations/${org.slug}`} style={{ textDecoration: 'none' }}>
                <Card interactive className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={org.avatar_url}
                        alt={org.name}
                        size="md"
                        fallback={org.name[0]?.toUpperCase() || 'O'}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--color-text-white)' }}>
                          {org.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {org.tournament_count || 0} tournaments • {org.follower_count || 0} followers
                        </div>
                      </div>
                    </div>
                    <Badge variant={org.role === 'OWNER' ? 'danger' : org.role === 'MANAGER' ? 'primary' : 'neutral'}>
                      {org.role}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
