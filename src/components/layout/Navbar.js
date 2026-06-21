'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import SearchModal from '@/components/layout/SearchModal'
import './Navbar.css'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const dropdownRef = useRef(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('username, display_name, avatar_url')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('username, display_name, avatar_url')
            .eq('id', session.user.id)
            .single()
          setProfile(data)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { 
      href: '/tournaments', 
      label: 'Tournaments', 
      icon: <span className="nav-emoji">🏆</span>
    },
    { 
      href: '/organizations', 
      label: 'Organizations', 
      icon: <span className="nav-emoji">🏰</span>
    },
    { 
      href: '/leaderboard', 
      label: 'Leaderboard', 
      icon: <span className="nav-emoji">👑</span>
    },
  ]

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} id="main-navbar">
        <div className="navbar-inner">
          {/* Logo / Portal Target */}
          {pathname.startsWith('/organizations/') && pathname.split('/').length >= 3 ? (
            <div id="navbar-org-portal" className="flex items-center gap-3"></div>
          ) : (
            <Link href="/" className="navbar-logo" id="navbar-logo">
              <svg className="navbar-logo-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span className="navbar-logo-text">
                Tourna<span>Dash</span>
              </span>
            </Link>
          )}

          {/* Desktop Nav Links */}
          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`navbar-link ${pathname === link.href ? 'navbar-link-active' : ''}`}
                  id={`nav-link-${link.href.slice(1)}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Side Actions */}
          <div className="navbar-actions">
            {/* Search Button */}
            <button
              className="navbar-search-btn hide-mobile"
              onClick={() => setSearchOpen(true)}
              id="navbar-search-btn"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search...</span>
              <span className="navbar-search-kbd">⌘K</span>
            </button>

            {/* Auth */}
            {user ? (
              <div className="navbar-user" ref={dropdownRef}>
                <button
                  className="navbar-user-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  id="navbar-user-menu-btn"
                >
                  <Avatar src={profile?.avatar_url} alt={profile?.display_name || 'User'} size="sm" />
                  <span className="hide-mobile navbar-user-name">
                    {profile?.display_name || 'User'}
                  </span>
                  <svg className="dropdown-arrow-icon" viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="navbar-user-dropdown" id="navbar-user-dropdown">
                    <Link
                      href="/dashboard"
                      className="navbar-user-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                      id="dropdown-dashboard"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="9"></rect>
                        <rect x="14" y="3" width="7" height="5"></rect>
                        <rect x="14" y="12" width="7" height="9"></rect>
                        <rect x="3" y="16" width="7" height="5"></rect>
                      </svg>
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      className="navbar-user-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                      id="dropdown-profile"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      My Profile
                    </Link>
                    <div className="navbar-user-dropdown-divider" />
                    <button
                      className="navbar-user-dropdown-item navbar-user-dropdown-item-danger"
                      onClick={handleSignOut}
                      id="dropdown-signout"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn btn-ghost btn-sm" id="navbar-login-btn">
                  Log In
                </Link>
                <Link href="/signup" className="btn btn-primary btn-sm" id="navbar-signup-btn">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="navbar-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              id="navbar-mobile-toggle"
            >
              {mobileMenuOpen ? (
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'navbar-mobile-menu-open' : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="navbar-mobile-link"
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
        <hr className="divider" style={{ border: 'none', height: '1px', backgroundColor: 'var(--color-border)', margin: 'var(--space-2) 0' }} />
        {user ? (
          <>
            <Link href="/dashboard" className="navbar-mobile-link">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 'var(--space-2)' }}>
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
              Dashboard
            </Link>
            <Link href="/dashboard/profile" className="navbar-mobile-link">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 'var(--space-2)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              My Profile
            </Link>
            <Link href="/dashboard/themes" className="navbar-mobile-link">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 'var(--space-2)' }}>
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h3.016C20.04 16.394 22 14.434 22 12c0-5.5-4.5-10-10-10z"></path>
              </svg>
              Themes
            </Link>
            <button
              className="navbar-mobile-link"
              onClick={handleSignOut}
              style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center' }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 'var(--space-2)' }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign Out
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3" style={{ marginTop: 'var(--space-4)' }}>
            <Link href="/login" className="btn btn-secondary btn-lg" style={{ justifyContent: 'center' }}>
              Log In
            </Link>
            <Link href="/signup" className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
              Sign Up
            </Link>
          </div>
        )}
      </div>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
