import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - var(--nav-height) - 120px)',
      textAlign: 'center',
      padding: 'var(--space-12) var(--space-6)',
    }}>
      <div style={{
        position: 'relative',
        marginBottom: 'var(--space-8)',
      }}>
        <h1 style={{
          fontSize: '120px',
          fontWeight: '900',
          lineHeight: '1',
          margin: 0,
          color: 'var(--color-border)',
          opacity: 0.15,
          letterSpacing: '-0.05em',
          userSelect: 'none',
        }}>
          404
        </h1>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
        }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: '800',
            color: 'var(--color-text-white)',
            margin: 0,
          }}>
            Page Not Found
          </h2>
        </div>
      </div>

      <p style={{
        color: 'var(--color-text-secondary)',
        maxWidth: '460px',
        fontSize: 'var(--text-base)',
        lineHeight: 'var(--leading-relaxed)',
        marginBottom: 'var(--space-8)',
      }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <div className="flex gap-4">
        <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Go Home
        </Link>
        <Link href="/tournaments" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          Browse Tournaments
        </Link>
      </div>
    </div>
  )
}
