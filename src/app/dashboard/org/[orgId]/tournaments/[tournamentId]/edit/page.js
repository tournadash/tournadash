'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { uploadThumbnail, deleteImageByUrl } from '@/lib/supabase/storage'

export default function EditTournamentPage() {
  const { orgId, tournamentId } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [slugError, setSlugError] = useState('')
  const [checkingSlug, setCheckingSlug] = useState(false)

  const fileInputRef = useRef(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)

  useEffect(() => {
    const fetchTournament = async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single()

      if (error) {
        setError(`Failed to load tournament: ${error.message}`)
      } else if (data) {
        // Fetch server IP
        const { data: ipData } = await supabase
          .from('tournament_server_ips')
          .select('*')
          .eq('tournament_id', tournamentId)
          .maybeSingle()

        setForm({
          name: data.name || '',
          slug: data.slug || '',
          short_description: data.short_description || '',
          description: data.description || '',
          rules: data.rules || '',
          trailer_url: data.trailer_url || '',
          live_tournament_url: data.live_tournament_url || '',
          registration_url: data.registration_url || '',
          max_players: data.max_players !== null ? String(data.max_players) : '',
          starts_at: data.starts_at ? data.starts_at.slice(0, 16) : '', // format for datetime-local
          comments_enabled: !!data.comments_enabled,
          likes_visible: !!data.likes_visible,
          dislikes_visible: !!data.dislikes_visible,
          followers_only_comments: !!data.followers_only_comments,
          registration_type: data.registration_type || 'native',
          registration_open: data.registration_open !== false,
          discord_guild_id: data.discord_guild_id || '',
          discord_invite_url: data.discord_invite_url || '',
          use_custom_discord: !!data.use_custom_discord,
          server_ip: ipData?.server_ip || '',
          ip_revealed: !!ipData?.ip_revealed,
          auto_select_count: data.auto_select_count !== null ? String(data.auto_select_count) : '',
          auto_fill: !!data.auto_fill,
          require_discord: !!data.require_discord,
          require_follow: !!data.require_follow,
          is_private: !!data.is_private,
          ends_at: data.ends_at ? data.ends_at.slice(0, 16) : '',
          prizepool: data.prizepool || '',
        })
        setThumbnailPreview(data.banner_url || null)
      }
      setLoading(false)
    }

    fetchTournament()
  }, [tournamentId])

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSlugBlur = async () => {
    const slugVal = form?.slug?.trim()
    if (!slugVal) return
    
    setCheckingSlug(true)
    setSlugError('')
    
    const { data, error: fetchError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('organization_id', orgId)
      .eq('slug', slugVal)
      .neq('id', tournamentId)
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
    setSaving(true)
    setError('')
    setSuccess('')

    if (!form.name.trim()) { 
      setError('Tournament name is required')
      setSaving(false)
      return 
    }

    let bannerUrl = thumbnailPreview

    if (thumbnailFile) {
      try {
        bannerUrl = await uploadThumbnail(tournamentId, thumbnailFile)
        // If there was an old thumbnail and it changed, we delete it
        const { data: currentTour } = await supabase
          .from('tournaments')
          .select('banner_url')
          .eq('id', tournamentId)
          .single()

        if (currentTour?.banner_url && currentTour.banner_url !== bannerUrl) {
          await deleteImageByUrl(currentTour.banner_url)
        }
      } catch (uploadError) {
        setError(`Failed to upload thumbnail: ${uploadError.message}`)
        setSaving(false)
        return
      }
    }

    const updatePayload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      trailer_url: form.trailer_url.trim() || null,
      live_tournament_url: form.live_tournament_url.trim() || null,
      registration_url: form.registration_type === 'external' ? (form.registration_url.trim() || null) : null,
      max_players: form.max_players ? parseInt(form.max_players) : null,
      starts_at: form.starts_at || null,
      comments_enabled: form.comments_enabled,
      likes_visible: form.likes_visible,
      dislikes_visible: form.dislikes_visible,
      followers_only_comments: form.followers_only_comments,
      registration_type: form.registration_type,
      registration_open: form.registration_open,
      max_registrations: form.max_registrations ? parseInt(form.max_registrations) : null,
      discord_guild_id: form.discord_guild_id.trim() || null,
      discord_invite_url: form.discord_invite_url.trim() || null,
      use_custom_discord: !!form.use_custom_discord,
      auto_select_count: form.auto_select_count ? parseInt(form.auto_select_count) : null,
      auto_fill: !!form.auto_fill,
      require_discord: !!form.require_discord,
      require_follow: !!form.require_follow,
      is_private: !!form.is_private,
      ends_at: form.ends_at || null,
      banner_url: bannerUrl,
      prizepool: form.prizepool.trim() || null,
    }

    let { error: updateError } = await supabase
      .from('tournaments')
      .update(updatePayload)
      .eq('id', tournamentId)

    if (updateError && (updateError.code === '42703' || updateError.message.includes('short_description') || updateError.message.includes('auto_select_count') || updateError.message.includes('require_discord') || updateError.message.includes('require_follow') || updateError.message.includes('prizepool') || updateError.message.includes('use_custom_discord'))) {
      const fallbackPayload = { ...updatePayload }
      delete fallbackPayload.short_description
      delete fallbackPayload.auto_select_count
      delete fallbackPayload.auto_fill
      delete fallbackPayload.require_discord
      delete fallbackPayload.require_follow
      delete fallbackPayload.ends_at
      delete fallbackPayload.prizepool
      delete fallbackPayload.use_custom_discord
      const fallbackResult = await supabase
        .from('tournaments')
        .update(fallbackPayload)
        .eq('id', tournamentId)
      updateError = fallbackResult.error
    }

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Upsert server IP if provided
    if (form.server_ip && form.server_ip.trim()) {
      await supabase
        .from('tournament_server_ips')
        .upsert({
          tournament_id: tournamentId,
          server_ip: form.server_ip.trim(),
          ip_revealed: !!form.ip_revealed
        })
    } else {
      await supabase
        .from('tournament_server_ips')
        .delete()
        .eq('tournament_id', tournamentId)
    }

    setSuccess('Tournament details updated successfully.')
    setTimeout(() => {
      router.push(`/dashboard/org/${orgId}/tournaments/${tournamentId}`)
      router.refresh()
    }, 1500)
    setSaving(false)
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

  if (!form) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
        <h2 className="dashboard-page-title" style={{ fontSize: 'var(--text-lg)' }}>Tournament not found</h2>
        <Button onClick={() => router.back()}>Back</Button>
      </Card>
    )
  }

  return (
    <div id="edit-tournament-page" className="flex flex-col gap-8">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Edit Tournament</h1>
          <p className="dashboard-page-subtitle">Update tournament details, phases, and verification settings.</p>
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

      {success && (
        <div className="auth-success animate-fade-in" style={{ marginBottom: 0 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} id="edit-tournament-form" className="flex flex-col gap-6">
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
                  Change Thumbnail
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
              onChange={(e) => updateForm('name', e.target.value)} 
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
            label="YouTube Trailer URL (Optional)" 
            type="url" 
            placeholder="https://youtube.com/watch?v=..." 
            value={form.trailer_url} 
            onChange={(e) => updateForm('trailer_url', e.target.value)} 
            helperText="YouTube video URL."
          />

          <Input 
            label="Live Tournament URL (Optional)" 
            type="url" 
            placeholder="https://youtube.com/live/... or https://twitch.tv/..." 
            value={form.live_tournament_url} 
            onChange={(e) => updateForm('live_tournament_url', e.target.value)} 
            helperText="YouTube Live or Twitch URL."
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
                  
                  <div className="mb-4">
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                      Discord Server settings
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer p-3" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', flex: 1 }}>
                        <input
                          type="radio"
                          name="discord_source"
                          checked={!form.use_custom_discord}
                          onChange={() => updateForm('use_custom_discord', false)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                        />
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'block', color: 'var(--color-text)' }}>Default Organization Settings</span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Inherit the Discord settings from organization settings.</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-3" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', flex: 1 }}>
                        <input
                          type="radio"
                          name="discord_source"
                          checked={form.use_custom_discord}
                          onChange={() => updateForm('use_custom_discord', true)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                        />
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'block', color: 'var(--color-text)' }}>Use Custom Discord Server</span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Configure a separate Discord server specifically for this event.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {form.use_custom_discord ? (
                    <div className="grid grid-cols-2 gap-6 mt-4">
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
                  ) : (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ color: '#5865F2' }}>
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
                      </svg>
                      <span>Using organization default Discord server. Fill or modify it under <strong>Organization Settings</strong>.</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 mt-4">
                    <label className="flex items-center gap-2 cursor-pointer p-3" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', width: 'fit-content', marginBottom: 0 }}>
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
                    {form.require_discord && (
                      <div style={{ paddingLeft: 'var(--space-2)' }}>
                        <a 
                          href="https://discord.com/api/oauth2/authorize?client_id=1517466838353838172&permissions=8&scope=bot" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', backgroundColor: '#5865F2', color: '#fff', border: 'none' }}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
                          </svg>
                          Invite Bot to Guild
                        </a>
                      </div>
                    )}
                  </div>
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

        {/* Tournament Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>Settings</h3>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-4">
            <Input 
              label="Max Players" 
              type="number" 
              min="2" 
              placeholder="Unlimited" 
              value={form.max_players} 
              onChange={(e) => updateForm('max_players', e.target.value)} 
            />
            <Input 
              label="Prize Pool (Optional)" 
              type="text" 
              placeholder="e.g. $1,000, 5000 Robux, Custom, etc." 
              value={form.prizepool} 
              onChange={(e) => updateForm('prizepool', e.target.value)} 
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
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
              { key: 'is_private', label: 'Private Tournament', desc: 'Hide this tournament from search, browse listings, and public profiles' },
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

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={saving} id="save-tournament-btn">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
