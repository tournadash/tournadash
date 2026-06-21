'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/components/providers/ThemeProvider'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function ThemesPage() {
  const { theme, saveTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState(theme)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  // Update selection when context loads
  useEffect(() => {
    setSelectedTheme(theme)
  }, [theme])

  // Live Preview effect
  useEffect(() => {
    const classes = document.body.className.split(' ').filter(c => !c.startsWith('theme-'))
    if (selectedTheme !== 'default') {
      classes.push(`theme-${selectedTheme}`)
    }
    document.body.className = classes.join(' ').trim()

    // Cleanup: revert to context theme on unmount if not saved
    return () => {
      const resetClasses = document.body.className.split(' ').filter(c => !c.startsWith('theme-'))
      if (theme !== 'default') {
        resetClasses.push(`theme-${theme}`)
      }
      document.body.className = resetClasses.join(' ').trim()
    }
  }, [selectedTheme, theme])

  const handleSave = async () => {
    setSaving(true)
    await saveTheme(selectedTheme)
    setSuccess('Theme saved successfully!')
    setTimeout(() => setSuccess(''), 3000)
    setSaving(false)
  }

  const themes = [
    {
      id: 'default',
      name: 'Default TournaDash',
      description: 'The standard, sleek dark-mode aesthetic with refined borders and smooth transitions.',
      previewColor: '#1a1a1a',
      accentColor: '#38bdf8'
    },
    {
      id: 'neon-arcade',
      name: 'Neon Arcade',
      description: 'A blocky, high-contrast retro aesthetic featuring solid borders, sharp corners, and neon yellow accents.',
      previewColor: '#121212',
      accentColor: '#facc15',
      previewBgImage: "linear-gradient(#0a0a0abf, #0a0a0ad9), url('https://vault-op-tournaments.vercel.app/bg-image.png')"
    }
  ]

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Global Themes</h1>
          <p className="dashboard-page-subtitle">Customize the appearance of your dashboard and public pages.</p>
        </div>
        <Button loading={saving} onClick={handleSave}>Save Theme</Button>
      </div>

      {success && (
        <div className="auth-success" style={{ marginBottom: 0 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.map(t => (
          <Card 
            key={t.id} 
            className="cursor-pointer overflow-hidden relative"
            style={{ 
              borderColor: selectedTheme === t.id ? 'var(--color-primary)' : 'var(--color-border)',
              borderWidth: selectedTheme === t.id ? '2px' : '1px'
            }}
            onClick={() => setSelectedTheme(t.id)}
          >
            {selectedTheme === t.id && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--color-primary)', zIndex: 10 }}>
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            )}
            
            <div style={{ 
              height: '140px', 
              backgroundColor: t.previewColor,
              backgroundImage: t.previewBgImage || 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderBottom: '1px solid var(--color-border)',
              margin: '-24px -24px 24px -24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '60%',
                height: '40%',
                backgroundColor: 'var(--color-bg-card)',
                border: `1px solid ${t.accentColor}`,
                borderRadius: t.id === 'neon-arcade' ? '0px' : '8px',
                boxShadow: t.id === 'neon-arcade' ? `4px 4px 0px 0px ${t.accentColor}` : '0 4px 6px rgba(0,0,0,0.1)'
              }} />
            </div>

            <h3 className="dashboard-page-title mb-2" style={{ fontSize: 'var(--text-lg)' }}>{t.name}</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>
              {t.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
