'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import { uploadAvatar, deleteImageByUrl, uploadSkin } from '@/lib/supabase/storage'
import MinecraftSkinViewer from '@/components/ui/MinecraftSkinViewer'

export default function ProfileEditPage() {
  const [profile, setProfile] = useState(null)
  const [originalIgn, setOriginalIgn] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const fileInputRef = useRef(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [usernameError, setUsernameError] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [disguiseError, setDisguiseError] = useState('')
  const [checkingDisguise, setCheckingDisguise] = useState(false)

  const skinFileInputRef = useRef(null)
  const [skinFile, setSkinFile] = useState(null)
  const [skinPreview, setSkinPreview] = useState(null)
  const [searchingSkin, setSearchingSkin] = useState(false)
  const [searchIgn, setSearchIgn] = useState('')

  // IGN change confirm states
  const [showIgnConfirmModal, setShowIgnConfirmModal] = useState(false)
  const [ignConfirm1, setIgnConfirm1] = useState('')
  const [ignConfirm2, setIgnConfirm2] = useState('')
  const [ignConfirm3, setIgnConfirm3] = useState('')
  const [pendingIgn, setPendingIgn] = useState('')
  const [generatingToken, setGeneratingToken] = useState(false)
  const [showToken, setShowToken] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const countWords = (text) => {
    if (!text) return 0
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
        setOriginalIgn(data?.minecraft_ign || '')
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

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

  const handleSkinFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        setError('Skin file size must be less than 1MB.')
        return
      }
      setSkinFile(file)
      setSkinPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleSearchOnlineSkin = async (ignName) => {
    const targetIgn = (ignName || searchIgn).trim()
    if (!targetIgn) {
      setError('Please enter a Minecraft IGN to search.')
      return
    }

    setSearchingSkin(true)
    setError('')
    try {
      // 1. Try Mojang account search first via PlayerDB
      const res = await fetch(`https://playerdb.co/api/player/minecraft/${targetIgn}`)
      const json = await res.json()
      
      if (json.success && json.data?.player?.id) {
        const uuid = json.data.player.id
        const mcHeadsUrl = `https://mc-heads.net/skin/${uuid}`
        
        setSkinPreview(mcHeadsUrl)
        setSkinFile(null)
        updateField('minecraft_skin_url', mcHeadsUrl)
        setSuccess(`Found premium Mojang skin for ${json.data.player.username}! Click 'Save Changes' to apply.`)
        setTimeout(() => setSuccess(''), 3000)
        return
      }
      
      // 2. Fallback to check cracked skins on MineSkin EU
      const mineskinUrl = `https://mineskin.eu/skin/${targetIgn}`
      try {
        const mineRes = await fetch(mineskinUrl, { method: 'HEAD' })
        if (mineRes.ok) {
          setSkinPreview(mineskinUrl)
          setSkinFile(null)
          updateField('minecraft_skin_url', mineskinUrl)
          setSuccess(`Found skin for cracked account "${targetIgn}" on MineSkin! Click 'Save Changes' to apply.`)
          setTimeout(() => setSuccess(''), 3000)
          return
        }
      } catch (headErr) {
        // If HEAD fails due to CORS, try loading it anyway
        setSkinPreview(mineskinUrl)
        setSkinFile(null)
        updateField('minecraft_skin_url', mineskinUrl)
        setSuccess(`Attempting to load cracked skin for "${targetIgn}" from MineSkin...`)
        setTimeout(() => setSuccess(''), 3000)
        return
      }
      
      setError(`Could not find a Minecraft player named "${targetIgn}" on Mojang or MineSkin.`)
    } catch (err) {
      setError(`Error searching skin: ${err.message}`)
    } finally {
      setSearchingSkin(false)
    }
  }

  const handleIgnBlur = async () => {
    const ign = profile?.minecraft_ign?.trim()
    if (!ign || ign === originalIgn) return
    handleSearchOnlineSkin(ign)
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    if (usernameError || disguiseError) {
      setError('Please resolve all validation errors before saving.')
      return
    }

    const bioWordCount = countWords(profile?.bio)
    if (bioWordCount > 200) {
      setError('Your bio exceeds the limit of 200 words.')
      return
    }

    const isIgnChanged = (profile.minecraft_ign || '').trim() !== (originalIgn || '').trim()

    if (isIgnChanged) {
      const changeCount = profile.ign_change_count || 0
      if (changeCount >= 2) {
        setError('You cannot change your Minecraft IGN anymore. It is locked.')
        return
      }

      if (changeCount === 1) {
        setPendingIgn((profile.minecraft_ign || '').trim())
        setIgnConfirm1('')
        setIgnConfirm2('')
        setIgnConfirm3('')
        setShowIgnConfirmModal(true)
        return
      }
    }

    await executeSave(profile.minecraft_ign, isIgnChanged ? 1 : 0)
  }

  const executeSave = async (newIgn, incrementBy) => {
    setSaving(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    let avatarUrl = profile.avatar_url
    let skinUrl = profile.minecraft_skin_url

    if (avatarFile) {
      try {
        avatarUrl = await uploadAvatar('users', user.id, avatarFile)
        if (profile.avatar_url) {
          await deleteImageByUrl(profile.avatar_url)
        }
      } catch (uploadError) {
        setError(`Failed to upload avatar: ${uploadError.message}`)
        setSaving(false)
        return
      }
    }

    if (skinFile) {
      try {
        skinUrl = await uploadSkin(user.id, skinFile)
        if (profile.minecraft_skin_url && profile.minecraft_skin_url.includes('supabase.co')) {
          await deleteImageByUrl(profile.minecraft_skin_url)
        }
      } catch (uploadError) {
        setError(`Failed to upload skin: ${uploadError.message}`)
        setSaving(false)
        return
      }
    }

    const nextChangeCount = (profile.ign_change_count || 0) + incrementBy
    const formattedIgn = newIgn ? newIgn.trim() : null

    const { error: updateError } = await supabase
      .from('users')
      .update({
        display_name: profile.display_name,
        username: profile.username,
        bio: profile.bio,
        minecraft_ign: formattedIgn,
        minecraft_skin_url: skinUrl,
        ign_change_count: nextChangeCount,
        social_youtube: profile.social_youtube,
        social_discord: profile.social_discord,
        social_twitch: profile.social_twitch,
        avatar_url: avatarUrl,
        disguise_ign: profile.disguise_ign ? profile.disguise_ign.trim() : null,
      })
      .eq('id', user.id)

    if (updateError) {
      if (updateError.code === '23505' || updateError.message.includes('unique_minecraft_ign') || updateError.message.includes('duplicate')) {
        setError('This Minecraft IGN is already registered by another user. Each player must have a unique IGN.')
      } else {
        setError(updateError.message)
      }
    } else {
      setSuccess('Profile updated successfully!')
      setOriginalIgn(newIgn || '')
      setProfile(prev => ({ 
        ...prev, 
        avatar_url: avatarUrl, 
        minecraft_skin_url: skinUrl, 
        ign_change_count: nextChangeCount, 
        minecraft_ign: formattedIgn 
      }))
      setAvatarFile(null)
      setSkinFile(null)
      setTimeout(() => setSuccess(''), 3000)
      router.refresh()
    }
    setSaving(false)
  }

  const handleConfirmFinalSave = async (e) => {
    e.preventDefault()
    const trimmedPending = pendingIgn.trim()
    if (
      ignConfirm1.trim() !== trimmedPending ||
      ignConfirm2.trim() !== trimmedPending ||
      ignConfirm3.trim() !== trimmedPending
    ) {
      setError('Confirmation inputs do not match the new IGN. Please type it exactly 3 times.')
      return
    }

    setShowIgnConfirmModal(false)
    await executeSave(pendingIgn, 1)
  }

  const updateField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerateToken = async () => {
    setGeneratingToken(true)
    setError('')
    setSuccess('')
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')
      
      const randPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const newToken = `td_key_${randPart}`

      const { error: updateError } = await supabase
        .from('users')
        .update({ minecraft_login_token: newToken })
        .eq('id', authUser.id)

      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, minecraft_login_token: newToken }))
      setSuccess('Minecraft login key generated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to generate key: ${err.message}`)
    } finally {
      setGeneratingToken(false)
    }
  }

  const handleLinkDiscord = async () => {
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard/profile`,
          scopes: ['identify']
        }
      })
      if (error) throw error
    } catch (err) {
      setError(`Failed to initiate Discord linking: ${err.message}`)
    }
  }

  const handleUnlinkDiscord = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: updateError } = await supabase
        .from('users')
        .update({
          discord_id: null,
          social_discord: null
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile(prev => ({
        ...prev,
        discord_id: null,
        social_discord: null
      }))
      setSuccess('Discord account unlinked successfully.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to unlink Discord: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete your profile? This will delete your public profile data. Your tournaments, registrations, and organizations will remain intact so you can recover them if you sign in again with the same account.')) return
    const verification = window.prompt('Please type "DELETE MY PROFILE" to confirm:')
    if (verification !== 'DELETE MY PROFILE') {
      alert('Confirmation text did not match. Profile deletion cancelled.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (deleteError) throw deleteError

      await supabase.auth.signOut()
      
      setSuccess('Account deleted successfully. Logging out...')
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(`Failed to delete account: ${err.message}`)
      setSaving(false)
    }
  }

  const handleUsernameBlur = async () => {
    const username = profile?.username?.trim()
    if (!username) return
    
    const { data: { user } } = await supabase.auth.getUser()
    const { data: currentUser } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()

    if (currentUser?.username?.toLowerCase() === username.toLowerCase()) {
      setUsernameError('')
      return
    }

    setCheckingUsername(true)
    setUsernameError('')
    
    const { data } = await supabase
      .from('users')
      .select('id')
      .ilike('username', username)
      .neq('id', user.id)
      .maybeSingle()

    if (data) {
      setUsernameError('This username is already taken.')
    }
    setCheckingUsername(false)
  }

  const handleDisguiseBlur = async () => {
    const disguise = profile?.disguise_ign?.trim()
    if (!disguise) {
      setDisguiseError('')
      return
    }

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(disguise)) {
      setDisguiseError('Minecraft IGNs must be 3-16 characters and contain only letters, numbers, and underscores.')
      return
    }

    setCheckingDisguise(true)
    setDisguiseError('')

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Check conflicts against other users' real IGNs
    const { data: conflictReal } = await supabase
      .from('users')
      .select('id')
      .ilike('minecraft_ign', disguise)
      .neq('id', user.id)
      .maybeSingle()

    if (conflictReal) {
      setDisguiseError('This name is already used as a real IGN by another player.')
      setCheckingDisguise(false)
      return
    }

    // 2. Check conflicts against other users' disguise IGNs
    const { data: conflictDisguise } = await supabase
      .from('users')
      .select('id')
      .ilike('disguise_ign', disguise)
      .neq('id', user.id)
      .maybeSingle()

    if (conflictDisguise) {
      setDisguiseError('This name is already used as a disguise IGN by another player.')
    }
    setCheckingDisguise(false)
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
    <div id="profile-edit-page" className="flex flex-col gap-8">
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-text">
          <h1 className="dashboard-page-title">Edit Profile</h1>
          <p className="dashboard-page-subtitle">Manage your public profile and Minecraft identity.</p>
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
      {success && (
        <div className="auth-success" style={{ marginBottom: 0 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} id="profile-form" className="flex flex-col gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>
              Basic Information
            </h3>
          </div>
          
          {/* Avatar Upload Selection */}
          <div className="flex items-center gap-6 mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Avatar
              src={avatarPreview || profile?.avatar_url}
              alt={profile?.display_name || 'Avatar'}
              size="xl"
              fallback={profile?.display_name?.[0]?.toUpperCase() || 'U'}
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
          
          <div className="grid grid-cols-2 gap-6">
            <Input
              id="profile-display-name"
              label="Display Name"
              type="text"
              placeholder="Your display name"
              value={profile?.display_name || ''}
              onChange={(e) => updateField('display_name', e.target.value)}
            />
            <Input
              id="profile-username"
              label="Username"
              type="text"
              placeholder="unique_username"
              value={profile?.username || ''}
              onChange={(e) => {
                setUsernameError('')
                updateField('username', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
              }}
              onBlur={handleUsernameBlur}
              error={usernameError}
              helperText={checkingUsername ? 'Checking availability...' : 'Letters, numbers, underscores, hyphens only'}
            />
          </div>
          
          <div className="mt-4">
            <div>
              <Input
                id="profile-bio"
                label="Bio"
                type="textarea"
                placeholder="Tell the community about yourself..."
                value={profile?.bio || ''}
                onChange={(e) => updateField('bio', e.target.value)}
                error={countWords(profile?.bio) > 200 ? 'Bio exceeds the 200 words limit' : ''}
              />
              <div style={{
                textAlign: 'right',
                fontSize: 'var(--text-xs)',
                color: countWords(profile?.bio) > 200 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                marginTop: '4px'
              }}>
                {countWords(profile?.bio)} / 200 words
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Config controls on Left */}
            <div className="flex flex-col gap-4" style={{ width: '100%' }}>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>
                  Minecraft Identity
                </h3>
              </div>

              <div className="flex gap-2 items-end">
                <div style={{ flex: 1 }}>
                  <Input
                    id="profile-ign"
                    label="Minecraft In-Game Name (IGN)"
                    type="text"
                    placeholder="Steve"
                    value={profile?.minecraft_ign || ''}
                    onChange={(e) => updateField('minecraft_ign', e.target.value)}
                    disabled={profile?.ign_change_count >= 2}
                    helperText={
                      profile?.ign_change_count >= 2 
                        ? "Locked: You have reached the maximum of 2 IGN changes." 
                        : profile?.ign_change_count === 1
                          ? "Warning: This is your final change. Saving it will lock your IGN from further edits."
                          : "You can change your Minecraft IGN at most twice. (1 change remaining after this)"
                    }
                  />
                </div>
              </div>

              <div>
                <Input
                  id="profile-disguise-ign"
                  label="Disguise IGN (Optional)"
                  type="text"
                  placeholder="e.g. Dream"
                  value={profile?.disguise_ign || ''}
                  onChange={(e) => updateField('disguise_ign', e.target.value)}
                  onBlur={handleDisguiseBlur}
                  error={disguiseError}
                  helperText="Optional disguise name to display on TournaDash-enabled Minecraft servers."
                />
              </div>

              {/* Skin file upload */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Upload Custom Skin PNG</label>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => skinFileInputRef.current.click()}>
                    Choose Skin File
                  </Button>
                  <input
                    ref={skinFileInputRef}
                    type="file"
                    accept="image/png"
                    onChange={handleSkinFileChange}
                    style={{ display: 'none' }}
                  />
                  {(skinFile || (skinPreview && skinPreview !== profile?.minecraft_skin_url)) && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSkinFile(null)
                        setSkinPreview(null)
                        updateField('minecraft_skin_url', profile?.minecraft_skin_url)
                        setError('')
                      }}
                      style={{ color: 'var(--color-danger)', padding: '4px 8px' }}
                    >
                      ↩️ Undo Change
                    </Button>
                  )}
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {skinFile ? skinFile.name : 'Choose a standard 64x64 or 64x32 PNG file'}
                  </span>
                </div>
              </div>

              {/* Custom skin search online */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Search & Apply Skin Online</label>
                <div className="flex gap-2">
                  <div style={{ flex: 1 }}>
                    <Input
                      id="search-ign-input"
                      type="text"
                      placeholder="Enter Minecraft name to copy skin"
                      value={searchIgn}
                      onChange={(e) => setSearchIgn(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={() => handleSearchOnlineSkin(searchIgn)}
                    loading={searchingSkin}
                  >
                    Apply Skin
                  </Button>
                </div>
              </div>
            </div>

            {/* 3D Skin Viewer on Right */}
            <div className="flex flex-col items-center justify-center w-full" style={{ alignSelf: 'center' }}>
              <label className="input-label" style={{ marginBottom: '8px', display: 'block', textAlign: 'center' }}>3D Avatar Model</label>
              <MinecraftSkinViewer skinUrl={skinPreview || profile?.minecraft_skin_url} width={200} height={300} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h3 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', marginBottom: 0 }}>
              Minecraft Integration Key
            </h3>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Use this secret key in the Minecraft Client Mod to link your game to your TournaDash account. Do not share this key with anyone!
          </p>
          <div className="flex gap-3 items-end">
            <div style={{ flex: 1 }}>
              <Input
                id="minecraft-login-token"
                label="Secret Login Key"
                type={showToken ? 'text' : 'password'}
                readOnly
                value={profile?.minecraft_login_token || 'No key generated yet'}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="flex gap-2" style={{ marginBottom: '4px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? 'Hide' : 'Show'}
              </Button>
              <Button
                type="button"
                onClick={handleGenerateToken}
                loading={generatingToken}
              >
                {profile?.minecraft_login_token ? 'Regenerate Key' : 'Generate Key'}
              </Button>
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
              Social Connections
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <Input
              id="profile-youtube"
              label="YouTube Channel URL"
              type="url"
              placeholder="https://youtube.com/@yourchannel"
              value={profile?.social_youtube || ''}
              onChange={(e) => updateField('social_youtube', e.target.value)}
            />
            <Input
              id="profile-twitch"
              label="Twitch Channel URL"
              type="url"
              placeholder="https://twitch.tv/yourchannel"
              value={profile?.social_twitch || ''}
              onChange={(e) => updateField('social_twitch', e.target.value)}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Discord Integration</label>
            {profile?.discord_id ? (
              <div className="flex items-center justify-between p-4" style={{ backgroundColor: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ color: '#5865F2' }}>
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
                  </svg>
                  <div>
                    <span style={{ fontWeight: 600, display: 'block', color: 'var(--color-text)' }}>@{profile?.social_discord || 'Linked'}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Discord User ID: {profile?.discord_id}</span>
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={handleUnlinkDiscord}>
                  Unlink Account
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4" style={{ backgroundColor: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  Connect your Discord account to verify server membership when registering for tournaments.
                </span>
                <Button variant="outline" size="sm" onClick={handleLinkDiscord}>
                  Link Discord Account
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} id="profile-save-btn" disabled={countWords(profile?.bio) > 200}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <Card style={{ borderColor: 'rgba(239, 68, 68, 0.25)', backgroundColor: 'rgba(239, 68, 68, 0.02)', marginTop: '24px' }} className="p-6">
        <h4 className="dashboard-page-title" style={{ fontSize: 'var(--text-base)', color: 'var(--color-danger)', marginBottom: '8px' }}>Danger Zone</h4>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Deleting your profile is a permanent action. All of your public profile details, bio, and settings will be deleted immediately. Your organization memberships and tournament registrations will be preserved so they are restored if you sign in again.
        </p>
        <Button variant="danger" size="sm" onClick={handleDeleteAccount} loading={saving}>
          Delete Profile
        </Button>
      </Card>

      {/* Confirm IGN final change modal */}
      <Modal
        isOpen={showIgnConfirmModal}
        onClose={() => setShowIgnConfirmModal(false)}
        title="⚠️ Final Minecraft IGN Change"
      >
        <form onSubmit={handleConfirmFinalSave} className="flex flex-col gap-4">
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
            You are about to make your <strong>second and final</strong> Minecraft IGN change. Once saved, you will <strong>never</strong> be able to change your Minecraft username on TournaDash again.
            <br /><br />
            Please type your new IGN (<strong>{pendingIgn}</strong>) exactly <strong>three times</strong> below to confirm:
          </div>

          <Input
            placeholder="Type the new name (1st time)"
            value={ignConfirm1}
            onChange={(e) => setIgnConfirm1(e.target.value)}
            required
          />
          <Input
            placeholder="Type the new name (2nd time)"
            value={ignConfirm2}
            onChange={(e) => setIgnConfirm2(e.target.value)}
            required
          />
          <Input
            placeholder="Type the new name (3rd time)"
            value={ignConfirm3}
            onChange={(e) => setIgnConfirm3(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setShowIgnConfirmModal(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Confirm Final Change & Lock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
