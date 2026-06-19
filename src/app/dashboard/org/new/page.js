'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function NewOrganizationPage() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [socialYoutube, setSocialYoutube] = useState('')
  const [socialDiscord, setSocialDiscord] = useState('')
  const [error, setError] = useState('')
  const [slugError, setSlugError] = useState('')
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (value) => {
    setName(value)
    setSlug(generateSlug(value))
    setSlugError('')
  }

  const handleSlugBlur = async () => {
    const trimmedSlug = slug.trim()
    if (!trimmedSlug) return
    
    setCheckingSlug(true)
    setSlugError('')
    
    const { data, error: fetchError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', trimmedSlug)
      .maybeSingle()
      
    if (data) {
      setSlugError('This URL slug is already taken.')
    }
    setCheckingSlug(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (slugError) {
      setError('Please resolve all validation errors before saving.')
      return
    }
    setLoading(true)
    setError('')

    if (!name.trim()) {
      setError('Organization name is required')
      setLoading(false)
      return
    }

    if (!slug.trim()) {
      setError('URL slug is required')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        bio: bio.trim() || null,
        social_youtube: socialYoutube.trim() || null,
        social_discord: socialDiscord.trim() || null,
      })
      .select()
      .single()

    if (orgError) {
      if (orgError.message.includes('duplicate')) {
        setError('An organization with this URL slug already exists. Please choose a different name.')
      } else {
        setError(orgError.message)
      }
      setLoading(false)
      return
    }

    // Add creator as OWNER
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'OWNER',
        minecraft_ign: null,
      })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    // Redirect to org dashboard
    router.push(`/dashboard/org/${org.id}`)
    router.refresh()
  }

  return (
    <div id="new-org-page" className="flex flex-col gap-8">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Create Organization</h1>
          <p className="dashboard-page-subtitle">
            Set up your tournament organization. You&apos;ll be the owner with full control.
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} id="new-org-form" className="flex flex-col gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>
              Organization Details
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            <Input
              id="org-name"
              label="Organization Name"
              type="text"
              placeholder="e.g., SpyGaming Tournaments"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              maxLength={50}
            />

            <div className="td-input-group">
              <label className="td-input-label" htmlFor="org-slug">URL Slug *</label>
              <div className="flex items-center w-full">
                <span style={{
                  padding: '0 var(--space-4)',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRight: 'none',
                  borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}>
                  tournadash.com/org/
                </span>
                <input
                  id="org-slug"
                  type="text"
                  className="td-input-field"
                  placeholder="spy-gaming"
                  value={slug}
                  onChange={(e) => {
                    setSlugError('')
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }}
                  onBlur={handleSlugBlur}
                  required
                  style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0', borderColor: slugError ? 'var(--color-danger)' : undefined }}
                />
              </div>
              {slugError ? (
                <span className="td-input-helper-msg" style={{ color: 'var(--color-danger)' }}>{slugError}</span>
              ) : (
                <span className="td-input-helper-msg">
                  {checkingSlug ? 'Checking availability...' : 'Lowercase letters, numbers, and hyphens only'}
                </span>
              )}
            </div>

            <Input
              id="org-bio"
              label="Bio / Description"
              type="textarea"
              placeholder="Tell the community about your organization..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>
              Social Links (Optional)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Input
              id="org-youtube"
              label="YouTube Channel"
              type="url"
              placeholder="https://youtube.com/@channel"
              value={socialYoutube}
              onChange={(e) => setSocialYoutube(e.target.value)}
            />
            <Input
              id="org-discord"
              label="Discord Server Invite"
              type="url"
              placeholder="https://discord.gg/invite"
              value={socialDiscord}
              onChange={(e) => setSocialDiscord(e.target.value)}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} id="create-org-btn">
            Create Organization
          </Button>
        </div>
      </form>
    </div>
  )
}
