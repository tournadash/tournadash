'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

function generateOrgToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = 'org_tok_'
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

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

  const [hasOwnedOrg, setHasOwnedOrg] = useState(false)
  const [checkingLimit, setCheckingLimit] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkLimit = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: owned } = await supabase
          .from('organization_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('role', 'OWNER')
          .limit(1)
        if (owned && owned.length > 0) {
          setHasOwnedOrg(true)
        }
      }
      setCheckingLimit(false)
    }
    checkLimit()
  }, [])

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length
  }

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

    const bioWordCount = countWords(bio)
    if (bioWordCount > 200) {
      setError('Your bio exceeds the limit of 200 words.')
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

    // Re-verify owned limit on submit
    const { data: owned } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'OWNER')
      .limit(1)
    if (owned && owned.length > 0) {
      setError('You can only create one organization of your own.')
      setLoading(false)
      return
    }

    const orgToken = generateOrgToken()

    // Create organization
    let insertPayload = {
      name: name.trim(),
      slug: slug.trim(),
      bio: bio.trim() || null,
      social_youtube: socialYoutube.trim() || null,
      social_discord: socialDiscord.trim() || null,
      org_token: orgToken,
    }

    let { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert(insertPayload)
      .select()
      .single()

    if (orgError && orgError.code === '42703') {
      const fallbackPayload = { ...insertPayload }
      delete fallbackPayload.org_token
      const fallbackResult = await supabase
        .from('organizations')
        .insert(fallbackPayload)
        .select()
        .single()
      org = fallbackResult.data
      orgError = fallbackResult.error
    }

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

  if (checkingLimit) {
    return (
      <div className="flex flex-col gap-6">
        <div className="dashboard-page-header">
          <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '300px', height: '18px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className="skeleton" style={{ height: '300px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  const bioWordCount = countWords(bio)

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

      {hasOwnedOrg && (
        <Card style={{ borderColor: 'var(--color-danger)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }} className="p-6">
          <div className="flex gap-3 items-start" style={{ color: 'var(--color-danger)' }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⚠️</span>
            <div>
              <h4 style={{ fontWeight: '600', color: 'var(--color-text-white)', marginBottom: '4px' }}>Ownership Limit Reached</h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                You can only create one organization of your own on the platform. If you wish to create a new organization, you must first delete your existing organization under its settings panel. You can still be invited to join other organizations as a Manager or Staff member.
              </p>
            </div>
          </div>
        </Card>
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
              disabled={hasOwnedOrg}
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
                  disabled={hasOwnedOrg}
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

            <div>
              <Input
                id="org-bio"
                label="Bio / Description"
                type="textarea"
                placeholder="Tell the community about your organization..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={hasOwnedOrg}
                error={bioWordCount > 200 ? 'Bio exceeds the 200 words limit' : ''}
              />
              <div style={{
                textAlign: 'right',
                fontSize: 'var(--text-xs)',
                color: bioWordCount > 200 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                marginTop: '4px'
              }}>
                {bioWordCount} / 200 words
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
              disabled={hasOwnedOrg}
            />
            <Input
              id="org-discord"
              label="Discord Server Invite"
              type="url"
              placeholder="https://discord.gg/invite"
              value={socialDiscord}
              onChange={(e) => setSocialDiscord(e.target.value)}
              disabled={hasOwnedOrg}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} id="create-org-btn" disabled={hasOwnedOrg || bioWordCount > 200}>
            Create Organization
          </Button>
        </div>
      </form>
    </div>
  )
}
