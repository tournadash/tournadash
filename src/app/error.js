'use client'

import { useEffect } from 'react'
import Button from '@/components/ui/Button'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

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
          color: 'var(--color-danger)',
          opacity: 0.15,
          letterSpacing: '-0.05em',
          userSelect: 'none',
        }}>
          500
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
            Something went wrong!
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
        An unexpected error occurred while rendering this page. If this problem persists, please contact support.
      </p>

      <div className="flex gap-4">
        <Button variant="primary" onClick={() => reset()}>
          Try Again
        </Button>
        <a href="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          Go Home
        </a>
      </div>
    </div>
  )
}
