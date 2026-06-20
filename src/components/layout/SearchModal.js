'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import './SearchModal.css'

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ tournaments: [], organizations: [], users: [] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const modalRef = useRef(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults({ tournaments: [], organizations: [], users: [] })
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle keyboard events (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Debounced search logic
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults({ tournaments: [], organizations: [], users: [] })
      return
    }

    const timer = setTimeout(() => {
      performSearch(trimmed)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const performSearch = async (q) => {
    setLoading(true)
    try {
      const [t, o, u] = await Promise.all([
        supabase.from('tournaments').select('id, name, slug, status, player_count, organizations(name)').eq('is_private', false).ilike('name', `%${q}%`).limit(5),
        supabase.from('organizations').select('id, name, slug, follower_count, tournament_count, avatar_url').ilike('name', `%${q}%`).limit(5),
        supabase.from('users').select('id, display_name, username, avatar_url, minecraft_ign').or(`display_name.ilike.%${q}%,username.ilike.%${q}%,minecraft_ign.ilike.%${q}%`).limit(5),
      ])

      setResults({
        tournaments: t.data || [],
        organizations: o.data || [],
        users: u.data || [],
      })
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ONGOING': return 'success'
      case 'SOON': return 'primary'
      default: return 'neutral'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ONGOING': return 'Live'
      case 'SOON': return 'Soon'
      default: return 'Ended'
    }
  }

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose()
    }
  }

  const handleItemClick = (href) => {
    onClose()
    router.push(href)
  }

  if (!isOpen) return null

  const hasResults = results.tournaments.length > 0 || results.organizations.length > 0 || results.users.length > 0

  return (
    <div className="search-modal-overlay" onClick={handleOverlayClick}>
      <div className="search-modal" ref={modalRef}>
        {/* Search Input Header */}
        <div className="search-modal-header">
          <svg className="search-modal-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search tournaments, organizations, players..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-modal-close" onClick={onClose}>
            esc
          </button>
        </div>

        {/* Search Results Body */}
        <div className="search-modal-body">
          {loading && (
            <div className="search-modal-loader">
              <span className="btn-spinner" style={{ color: 'var(--color-text-secondary)' }} />
              <p>Searching database...</p>
            </div>
          )}

          {!loading && query.trim().length >= 2 && !hasResults && (
            <div className="search-modal-empty">
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="search-modal-tip">
              <p>Type at least 2 characters to search...</p>
            </div>
          )}

          {!loading && hasResults && (
            <div className="search-results-list">
              {/* Tournaments Category */}
              {results.tournaments.length > 0 && (
                <div className="search-category">
                  <div className="search-category-title">Tournaments</div>
                  {results.tournaments.map(t => (
                    <div
                      key={t.id}
                      className="search-result-item"
                      onClick={() => handleItemClick(`/tournaments/${t.slug}`)}
                    >
                      <div className="search-result-item-main">
                        <span className="search-result-item-title">{t.name}</span>
                        <span className="search-result-item-subtitle">by {t.organizations?.name}</span>
                      </div>
                      <Badge variant={getStatusVariant(t.status)} style={{ fontSize: '10px' }}>
                        {getStatusLabel(t.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Organizations Category */}
              {results.organizations.length > 0 && (
                <div className="search-category">
                  <div className="search-category-title">Organizations</div>
                  {results.organizations.map(o => (
                    <div
                      key={o.id}
                      className="search-result-item"
                      onClick={() => handleItemClick(`/organizations/${o.slug}`)}
                    >
                      <div className="search-result-item-avatar-group">
                        <Avatar
                          src={o.avatar_url}
                          alt={o.name}
                          size="sm"
                          fallback={o.name[0]?.toUpperCase() || 'O'}
                        />
                        <div className="search-result-item-main">
                          <span className="search-result-item-title">{o.name}</span>
                          <span className="search-result-item-subtitle">@{o.slug}</span>
                        </div>
                      </div>
                      <span className="search-result-item-meta">{o.tournament_count || 0} events</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Players Category */}
              {results.users.length > 0 && (
                <div className="search-category">
                  <div className="search-category-title">Players</div>
                  {results.users.map(u => (
                    <div
                      key={u.id}
                      className="search-result-item"
                      onClick={() => handleItemClick(`/users/${u.username || u.id}`)}
                    >
                      <div className="search-result-item-avatar-group">
                        <Avatar
                          src={u.avatar_url}
                          alt={u.display_name || u.username || 'User'}
                          size="sm"
                          fallback={u.display_name?.[0]?.toUpperCase() || 'U'}
                        />
                        <div className="search-result-item-main">
                          <span className="search-result-item-title">{u.display_name || u.username || 'User'}</span>
                          <span className="search-result-item-subtitle">
                            {u.username ? `@${u.username}` : 'No username set'}
                          </span>
                        </div>
                      </div>
                      {u.minecraft_ign && (
                        <Badge variant="success" style={{ fontSize: '10px' }}>
                          {u.minecraft_ign}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
