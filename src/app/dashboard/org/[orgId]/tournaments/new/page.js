'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { uploadThumbnail } from '@/lib/supabase/storage'

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = 'whitelist_tok_'
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export default function NewTournamentPage() {
  const { orgId } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    trailer_url: '',
    live_tournament_url: '',
    registration_url: '',
    max_players: '',
    starts_at: '',
    comments_enabled: true,
    likes_visible: true,
    dislikes_visible: true,
    followers_only_comments: false,
    registration_type: 'native',
    registration_open: true,
    max_registrations: '',
    discord_guild_id: '',
    discord_invite_url: '',
    server_ip: '',
    ip_revealed: false,
    auto_select_count: '',
    auto_fill: false,
    require_discord: false,
    require_follow: false,
    ends_at: '',
  })
  
  const fileInputRef = useRef(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  
  const [error, setError] = useState('')
  const [slugError, setSlugError] = useState('')
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [loading, setLoading] = useState(false)

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  const handleNameChange = (value) => {
    updateForm('name', value)
    updateForm('slug', generateSlug(value))
    setSlugError('')
  }

  const handleSlugBlur = async () => {
    const slugVal = form.slug.trim()
    if (!slugVal) return
    
    setCheckingSlug(true)
    setSlugError('')
    
    const { data, error: fetchError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('organization_id', orgId)
      .eq('slug', slugVal)
      .maybeSingle()
      
    if (data) {
      setSlugError('This slug is already taken by another tournament in this organization.')
    }
    setCheckingSlug(false)
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Thumbnail size must be less than 2MB.')
        return
      }
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (slugError) {
      setError('Please resolve all validation errors before saving.')
      return
    }
    setLoading(true)
    setError('')

    if (!form.name.trim()) { 
      setError('Tournament name is required')
      setLoading(false)
      return 
    }

    const serverToken = generateToken()

    const insertPayload = {
      organization_id: orgId,
      name: form.name.trim(),
      slug: form.slug.trim() || generateSlug(form.name),
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      trailer_url: form.trailer_url.trim() || null,
      live_tournament_url: form.live_tournament_url.trim() || null,
      registration_url: form.registration_type === 'external' ? (form.registration_url.trim() || null) : null,
      max_players: form.max_players ? parseInt(form.max_players) : null,
      starts_at: form.starts_at || null,
      status: 'SOON',
      server_token: serverToken,
      whitelist_enabled: true,
      comments_enabled: form.comments_enabled,
      likes_visible: form.likes_visible,
      dislikes_visible: form.dislikes_visible,
      followers_only_comments: form.followers_only_comments,
      registration_type: form.registration_type,
      registration_open: form.registration_open,
      max_registrations: form.max_registrations ? parseInt(form.max_registrations) : null,
      discord_guild_id: form.discord_guild_id.trim() || null,
      discord_invite_url: form.discord_invite_url.trim() || null,
      auto_select_count: form.auto_select_count ? parseInt(form.auto_select_count) : null,
      auto_fill: !!form.auto_fill,
      require_discord: !!form.require_discord,
      require_follow: !!form.require_follow,
      ends_at: form.ends_at || null,
    }

    let { data, error: insertError } = await supabase
      .from('tournaments')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError && (insertError.code === '42703' || insertError.message.includes('short_description') || insertError.message.includes('auto_select_count') || insertError.message.includes('require_discord') || insertError.message.includes('require_follow'))) {
      const fallbackPayload = { ...insertPayload }
      delete fallbackPayload.short_description
      delete fallbackPayload.auto_select_count
      delete fallbackPayload.auto_fill
      delete fallbackPayload.require_discord
      delete fallbackPayload.require_follow
      delete fallbackPayload.ends_at
      const fallbackResult = await supabase
        .from('tournaments')
        .insert(fallbackPayload)
        .select()
        .single()
      data = fallbackResult.data
      insertError = fallbackResult.error
    }

    if (insertError) {
      if (insertError.message.includes('duplicate')) {
        setError('A tournament with this slug already exists in this organization.')
      } else {
        setError(insertError.message)
      }
      setLoading(false)
      return
    }

    // Insert server IP if provided
    if (form.server_ip && form.server_ip.trim()) {
      await supabase
        .from('tournament_server_ips')
        .insert({
          tournament_id: data.id,
          server_ip: form.server_ip.trim(),
          ip_revealed: !!form.ip_revealed
        })
    }

    if (thumbnailFile) {
      try {
        const url = await uploadThumbnail(data.id, thumbnailFile)
        await supabase
          .from('tournaments')
          .update({ banner_url: url })
          .eq('id', data.id)
      } catch (uploadError) {
        console.error('Failed to upload thumbnail:', uploadError)
      }
    }

    router.push(`/dashboard/org/${orgId}/tournaments/${data.id}`)
    router.refresh()
  }

  return (
    <div id="new-tournament-page" className="flex flex-col gap-8">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Create Tournament</h1>
          <p className="dashboard-page-subtitle">Set up a new tournament event. A unique server token will be auto-generated for the plugin.</p>
        </div>
      </div>

      {error && (
        <div className="auth-error animate-fade-in" style={{ marginBottom: 0 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} id="new-tournament-form" className="flex flex-col gap-6">
        {/* Basic Info */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>Basic Information</h3>
          </div>

          {/* Thumbnail Selection */}
          <div className="flex items-center gap-6 mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: '120px', height: '67.5px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--color-text-muted)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <Button variant="outline" size="sm" onClick={triggerFileInput}>
                  Upload Thumbnail
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  style={{ display: 'none' }}
                />
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                JPG, PNG or WEBP. Max 2MB (16:9 recommended).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Input 
              label="Tournament Name" 
              placeholder="e.g., Bedwars Season 1" 
              value={form.name} 
              onChange={(e) => handleNameChange(e.target.value)} 
              required 
              maxLength={100} 
            />
            <Input 
              label="URL Slug" 
              placeholder="bedwars-s1" 
              value={form.slug} 
              onChange={(e) => {
                setSlugError('')
                updateForm('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }} 
              onBlur={handleSlugBlur}
              error={slugError}
              helperText={checkingSlug ? 'Checking availability...' : 'Lowercase letters, numbers, and hyphens only'}
              required 
            />
          </div>

          <div className="mt-4">
            <Input 
              label="Short Description" 
              type="textarea" 
              placeholder="Brief summary shown on tournament listings (max 150 characters)..." 
              value={form.short_description} 
              onChange={(e) => updateForm('short_description', e.target.value)} 
              maxLength={150}
              helperText={`${form.short_description ? form.short_description.length : 0} / 150 characters`}
            />
          </div>

          <div className="mt-4">
            <Input 
              label="Long Description" 
              type="textarea" 
              placeholder="Describe your tournament in detail, prizes, format, schedule..." 
              value={form.description} 
              onChange={(e) => updateForm('description', e.target.value)} 
            />
          </div>

          <div className="mt-4">
            <Input 
              label="Rules" 
              type="textarea" 
              placeholder="Tournament rules, code of conduct..." 
              value={form.rules} 
              onChange={(e) => updateForm('rules', e.target.value)} 
            />
          </div>
        </Card>

        {/* Links & Media */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <rect x="2" y="2" width="20" height="14" rx="2.18" ry="2.18"/>
              <line x1="12" y1="20" x2="12" y2="16"/>
              <line x1="8" y1="20" x2="16" y2="20"/>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>Links & Media</h3>
          </div>

          <Input 
            label="YouTube Trailer URL" 
            type="url" 
            placeholder="https://youtube.com/watch?v=..." 
            value={form.trailer_url} 
            onChange={(e) => updateForm('trailer_url', e.target.value)} 
            helperText="Displayed during the SOON phase"
          />

          <Input 
            label="Live Tournament URL" 
            type="url" 
            placeholder="https://youtube.com/live/... or https://twitch.tv/..." 
            value={form.live_tournament_url} 
            onChange={(e) => updateForm('live_tournament_url', e.target.value)} 
            helperText="Displayed during the ONGOING and ENDED phases"
          />
        </Card>

        {/* Registration System Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>Registration Settings</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="input-label">Registration Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer p-3" style={{ flex: 1, background: 'var(--color-bg-input)', border: form.registration_type === 'native' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <input
                    type="radio"
                    name="registration_type"
                    value="native"
                    checked={form.registration_type === 'native'}
                    onChange={() => updateForm('registration_type', 'native')}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'block', color: 'var(--color-text)' }}>Native Registration</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Sign-ups handled on-site with whitelist management.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-3" style={{ flex: 1, background: 'var(--color-bg-input)', border: form.registration_type === 'external' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <input
                    type="radio"
                    name="registration_type"
                    value="external"
                    checked={form.registration_type === 'external'}
                    onChange={() => updateForm('registration_type', 'external')}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'block', color: 'var(--color-text)' }}>External Registration</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Redirect users to an external website or form.</span>
                  </div>
                </label>
              </div>
            </div>

            {form.registration_type === 'native' ? (
              <div className="flex flex-col gap-4 mt-2 p-4" style={{ backgroundColor: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div className="grid grid-cols-2 gap-6">
                  <label className="flex items-center justify-between p-3" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Open for Sign-ups</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>Allow new players to register right now</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.registration_open}
                      onChange={(e) => updateForm('registration_open', e.target.checked)}
                      style={{ width: '44px', height: '24px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                    />
                  </label>

                  <Input
                    label="Max Native Registrations"
                    type="number"
                    placeholder="Unlimited"
                    value={form.max_registrations}
                    onChange={(e) => updateForm('max_registrations', e.target.value)}
                    helperText="Limit total player registrations on-site"
                  />
                  <Input
                    label="Auto-Select Whitelist Limit"
                    type="number"
                    placeholder="Manual Approval"
                    value={form.auto_select_count}
                    onChange={(e) => updateForm('auto_select_count', e.target.value)}
                    helperText="Auto-approve first N registrations on signup"
                  />
                </div>

                {form.auto_select_count && parseInt(form.auto_select_count) > 0 && (
                  <label className="flex items-center justify-between p-3 mt-2" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Auto-Replace slots on slot removal</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>If an approved player is removed, automatically approve the next registrant in line</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.auto_fill}
                      onChange={(e) => updateForm('auto_fill', e.target.checked)}
                      style={{ width: '44px', height: '24px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                    />
                  </label>
                )}

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text)' }}>Discord Verification Bot Requirements</h4>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="Discord Server Guild ID"
                      placeholder="e.g. 1157466838383583817"
                      value={form.discord_guild_id}
                      onChange={(e) => updateForm('discord_guild_id', e.target.value.trim())}
                      helperText="Required to verify server membership via Discord bot."
                    />
                    <Input
                      label="Discord Invite URL"
                      placeholder="https://discord.gg/your-server"
                      value={form.discord_invite_url}
                      onChange={(e) => updateForm('discord_invite_url', e.target.value.trim())}
                      helperText="Invite link shown to players if they need to join your server."
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-4 p-3" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                    <input
                      type="checkbox"
                      checked={form.require_discord}
                      onChange={(e) => updateForm('require_discord', e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'block', color: 'var(--color-text)' }}>Enforce Discord Membership Gating</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Only discord server members can register for the tournament.</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-4 p-3" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                    <input
                      type="checkbox"
                      checked={form.require_follow}
                      onChange={(e) => updateForm('require_follow', e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'block', color: 'var(--color-text)' }}>Require Organization Follow</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Users must follow this organization before they can register.</span>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-4" style={{ backgroundColor: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <Input
                  label="External Registration URL"
                  type="url"
                  placeholder="https://forms.gle/..."
                  value={form.registration_url}
                  onChange={(e) => updateForm('registration_url', e.target.value)}
                  required={form.registration_type === 'external'}
                  helperText="Players clicking Register will be redirected here."
                />
              </div>
            )}
          </div>
        </Card>

        {/* Tournament Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>Settings</h3>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Input 
              label="Max Players" 
              type="number" 
              min="2" 
              placeholder="Unlimited" 
              value={form.max_players} 
              onChange={(e) => updateForm('max_players', e.target.value)} 
            />
            <Input 
              label="Starts At" 
              type="datetime-local" 
              value={form.starts_at} 
              onChange={(e) => updateForm('starts_at', e.target.value)} 
            />
            <Input 
              label="Ends At (Optional)" 
              type="datetime-local" 
              value={form.ends_at} 
              onChange={(e) => updateForm('ends_at', e.target.value)} 
            />
          </div>

          {/* Toggle Settings */}
          <div className="flex flex-col gap-4 mt-6">
            {[
              { key: 'comments_enabled', label: 'Enable Comments', desc: 'Allow users to comment on the tournament page' },
              { key: 'likes_visible', label: 'Show Like Count', desc: 'Display the number of likes publicly' },
              { key: 'dislikes_visible', label: 'Show Dislike Button', desc: 'Allow users to dislike the tournament' },
              { key: 'followers_only_comments', label: 'Followers-Only Comments', desc: 'Only followers of your org can comment' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between" style={{
                padding: 'var(--space-4)',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--color-text-white)' }}>{label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => updateForm(key, e.target.checked)}
                  style={{ width: '44px', height: '24px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                />
              </label>
            ))}
          </div>
        </Card>

        {/* Server IP Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <rect x="2" y="2" width="20" height="14" rx="2.18" ry="2.18"/>
              <line x1="12" y1="20" x2="12" y2="16"/>
              <line x1="8" y1="20" x2="16" y2="20"/>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>Server Connection Settings</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Input 
              label="Minecraft Server IP" 
              placeholder="e.g., play.mydomain.com" 
              value={form.server_ip} 
              onChange={(e) => updateForm('server_ip', e.target.value)} 
              helperText="The server address participants will use to connect"
            />
            <label className="flex items-center justify-between p-3" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', height: 'fit-content', marginTop: '24px' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--color-text-white)' }}>Reveal IP to Participants</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Show the IP to approved participants once selected</div>
              </div>
              <input
                type="checkbox"
                checked={form.ip_revealed}
                onChange={(e) => updateForm('ip_revealed', e.target.checked)}
                style={{ width: '44px', height: '24px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              />
            </label>
          </div>
        </Card>

        {/* Plugin Info Banner */}
        <Card style={{ borderColor: 'rgba(88, 101, 242, 0.25)', backgroundColor: 'var(--color-primary-subtle)' }}>
          <div className="flex items-center gap-3">
            <div style={{ color: 'var(--color-primary)' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--color-primary)', fontSize: 'var(--text-sm)' }}>
                Server Token Auto-Generated
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                A unique server token will be generated for the Minecraft plugin. You&apos;ll find it on the tournament dashboard after creation.
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={loading} id="create-tournament-btn">
            Create Tournament
          </Button>
        </div>
      </form>
    </div>
  )
}
