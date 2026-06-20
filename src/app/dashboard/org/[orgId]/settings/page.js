'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { uploadAvatar, deleteImageByUrl } from '@/lib/supabase/storage'

export default function OrgSettingsPage() {
  const { orgId } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState(null)
  const [customLinks, setCustomLinks] = useState([])
  
  const fileInputRef = useRef(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const countWords = (text) => {
    if (!text) return 0
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('organizations').select('*').eq('id', orgId).single()
      setOrg(data)
      setCustomLinks(data?.custom_links || [])

      if (user) {
        const { data: m } = await supabase.from('organization_members').select('role').eq('organization_id', orgId).eq('user_id', user.id).single()
        setUserRole(m?.role)
      }
      setLoading(false)
    }
    load()
  }, [orgId])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Avatar size must be less than 2MB.')
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    const bioWordCount = countWords(org?.bio)
    if (bioWordCount > 200) {
      setError('Your bio exceeds the limit of 200 words.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    
    let avatarUrl = org.avatar_url

    if (avatarFile) {
      try {
        avatarUrl = await uploadAvatar('organizations', orgId, avatarFile)
        if (org.avatar_url) {
          await deleteImageByUrl(org.avatar_url)
        }
      } catch (uploadError) {
        setError(`Failed to upload avatar: ${uploadError.message}`)
        setSaving(false)
        return
      }
    }

    const { error: err } = await supabase
      .from('organizations')
      .update({
        name: org.name,
        bio: org.bio,
        social_youtube: org.social_youtube,
        social_discord: org.social_discord,
        social_twitch: org.social_twitch,
        custom_links: customLinks.filter(l => l.label && l.url),
        avatar_url: avatarUrl,
      })
      .eq('id', orgId)

    if (err) {
      setError(err.message)
    } else { 
      setSuccess('Settings saved!')
      setOrg(prev => ({ ...prev, avatar_url: avatarUrl }))
      setAvatarFile(null)
      setTimeout(() => setSuccess(''), 3000) 
      router.refresh()
    }
    setSaving(false)
  }

  const addCustomLink = () => setCustomLinks([...customLinks, { label: '', url: '' }])
  const removeCustomLink = (i) => setCustomLinks(customLinks.filter((_, idx) => idx !== i))
  const updateCustomLink = (i, field, value) => {
    const updated = [...customLinks]
    updated[i][field] = value
    setCustomLinks(updated)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to DELETE this organization? This action cannot be undone. All tournaments and data will be lost.')) return
    if (!confirm('This is your FINAL warning. Are you absolutely sure?')) return

    await supabase.from('organizations').delete().eq('id', orgId)
    router.push('/dashboard')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="dashboard-page-header">
          <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '300px', height: '18px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className="skeleton" style={{ height: '400px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  return (
    <div id="org-settings-page" className="flex flex-col gap-8">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Organization Settings</h1>
          <p className="dashboard-page-subtitle">Edit your organization&apos;s branding and details.</p>
        </div>
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
      {error && (
        <div className="auth-error" style={{ marginBottom: 0 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>Details</h3>
          </div>
          
          {/* Avatar Upload */}
          <div className="flex items-center gap-6 mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Avatar
              src={avatarPreview || org?.avatar_url}
              alt={org?.name || 'Organization Avatar'}
              size="xl"
              fallback={org?.name?.[0]?.toUpperCase() || 'O'}
            />
            <div className="flex flex-col gap-2">
              <div>
                <Button variant="outline" size="sm" onClick={triggerFileInput}>
                  Change Avatar
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                JPG, PNG or WEBP. Max 2MB.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <Input
              label="Organization Name"
              value={org?.name || ''}
              onChange={(e) => setOrg({ ...org, name: e.target.value })}
              required
            />
            <div>
              <Input
                label="Bio"
                type="textarea"
                value={org?.bio || ''}
                onChange={(e) => setOrg({ ...org, bio: e.target.value })}
                placeholder="About your organization..."
                error={countWords(org?.bio) > 200 ? 'Bio exceeds the 200 words limit' : ''}
              />
              <div style={{
                textAlign: 'right',
                fontSize: 'var(--text-xs)',
                color: countWords(org?.bio) > 200 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                marginTop: '4px'
              }}>
                {countWords(org?.bio)} / 200 words
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>Social Links</h3>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Input
              label="YouTube"
              type="url"
              value={org?.social_youtube || ''}
              onChange={(e) => setOrg({ ...org, social_youtube: e.target.value })}
              placeholder="https://youtube.com/@channel"
            />
            <Input
              label="Discord"
              type="url"
              value={org?.social_discord || ''}
              onChange={(e) => setOrg({ ...org, social_discord: e.target.value })}
              placeholder="https://discord.gg/invite"
            />
            <Input
              label="Twitch"
              type="url"
              value={org?.social_twitch || ''}
              onChange={(e) => setOrg({ ...org, social_twitch: e.target.value })}
              placeholder="https://twitch.tv/channel"
            />
          </div>
        </Card>

        {/* Discord Bot Integration */}
        <Card style={{ borderColor: 'rgba(88, 101, 242, 0.3)' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ color: '#5865F2' }}>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>Discord Verification Bot</h3>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            To require players to be members of your Discord server for tournament registrations, you must add our verification bot to your server.
          </p>
          <a
            href="https://discord.com/oauth2/authorize?client_id=1517466838353838172&permissions=0&scope=bot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            Invite Verification Bot
          </a>
        </Card>

        {/* Custom Links (Linktree) */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>Custom Buttons</h3>
            </div>
            <Button variant="secondary" size="sm" onClick={addCustomLink}>
              + Add Link
            </Button>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            Add custom buttons to your public org page (like Linktree — merch, socials, portfolio, etc.)
          </p>
          
          <div className="flex flex-col gap-4">
            {customLinks.map((link, i) => (
              <div key={i} className="flex gap-4 items-end">
                <div style={{ flex: 1 }}>
                  <Input
                    label={i === 0 ? 'Label' : ''}
                    placeholder="Button text"
                    value={link.label}
                    onChange={(e) => updateCustomLink(i, 'label', e.target.value)}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <Input
                    label={i === 0 ? 'URL' : ''}
                    type="url"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => updateCustomLink(i, 'url', e.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ color: 'var(--color-danger)', height: '40px' }}
                  onClick={() => removeCustomLink(i)}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </Button>
              </div>
            ))}
            
            {customLinks.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-6)' }}>
                No custom links yet. Click &quot;+ Add Link&quot; to create one.
              </p>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-4" style={{ marginBottom: 'var(--space-8)' }}>
          <Button type="submit" loading={saving} disabled={countWords(org?.bio) > 200}>
            Save Settings
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      {userRole === 'OWNER' && (
        <Card style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--color-danger)' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0, color: 'inherit' }}>Danger Zone</h3>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
            Deleting this organization will permanently remove all tournaments, whitelists, and data. This cannot be undone.
          </p>
          <Button variant="danger" onClick={handleDelete}>
            Delete Organization
          </Button>
        </Card>
      )}
    </div>
  )
}
