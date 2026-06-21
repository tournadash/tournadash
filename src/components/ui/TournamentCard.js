import Link from 'next/link'
import Badge from './Badge'
import Card from './Card'

export default function TournamentCard({ tournament, userRegistration }) {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'ONGOING': return 'success'
      case 'SOON': return 'primary'
      default: return 'neutral'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ONGOING': return 'LIVE'
      case 'SOON': return 'UPCOMING'
      default: return 'ENDED'
    }
  }

  const getStatusDot = (status) => {
    switch (status) {
      case 'ONGOING': return '🔴'
      case 'SOON': return '🟢'
      default: return '⚪'
    }
  }

  // Determine user status
  let userStatusLabel = 'NOT REGISTERED'
  let userStatusColor = 'var(--color-text-muted)'

  if (userRegistration) {
    if (userRegistration.status === 'SELECTED') {
      userStatusLabel = 'WHITELISTED / SELECTED'
      userStatusColor = 'var(--color-success)'
    } else if (userRegistration.status === 'REGISTERED') {
      userStatusLabel = 'REGISTERED'
      userStatusColor = 'var(--color-primary)'
    } else {
      userStatusLabel = userRegistration.status.toUpperCase()
      userStatusColor = 'var(--color-warning)'
    }
  } else if (tournament.status === 'ENDED') {
    userStatusLabel = 'EVENT CONCLUDED'
  }

  return (
    <Card interactive className="p-0 overflow-hidden flex flex-col h-full animate-on-scroll tournament-card-bg" style={{
      border: '2px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 4px 0 var(--color-border)'
    }}>
      {/* Card Header (Banner) */}
      <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
        {tournament.banner_url ? (
          <img src={tournament.banner_url} alt={tournament.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        )}

        {/* Status Badge Top Left (Transparent Text) */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', fontWeight: '800', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,1)', fontSize: '14px', letterSpacing: '0.05em' }}>
          {getStatusDot(tournament.status)} {getStatusLabel(tournament.status)}
        </div>

        {/* User Status Bottom Right */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          fontWeight: '800',
          color: userStatusColor,
          fontSize: '11px',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {userStatusLabel}
        </div>

        {/* Date Top Right */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: 'var(--text-xs)',
          fontWeight: '600',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {new Date(tournament.starts_at || tournament.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '4px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ fontWeight: '800', color: 'var(--color-text-white)', fontSize: 'var(--text-md)', margin: '4px 0' }}>
          {tournament.name}
        </h4>

        {/* Removed metadata grid */}

        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-4)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1
        }}>
          {tournament.short_description || (tournament.description ? (tournament.description.length > 120 ? tournament.description.substring(0, 120) + '...' : tournament.description) : 'No description provided.')}
        </p>

        {/* Action Button */}
        <Link href={`/tournaments/${tournament.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
          <button className="btn btn-secondary" style={{
            width: '100%',
            padding: '10px',
            fontWeight: '800',
            textTransform: 'uppercase'
          }}>
            VIEW TOURNAMENT ➔
          </button>
        </Link>
      </div>
    </Card>
  )
}
