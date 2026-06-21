'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ThemeContext = createContext({
  theme: 'default',
  setTheme: () => null,
  saveTheme: async () => null,
})

export const useTheme = () => useContext(ThemeContext)

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('default')
  const supabase = createClient()

  useEffect(() => {
    // 1. Try local storage first for instant load
    const stored = localStorage.getItem('tournadash_theme')
    if (stored) {
      setThemeState(stored)
    }

    // 2. Fetch from user profile
    const fetchUserTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Safe query in case the column doesn't exist yet for some users
        const { data, error } = await supabase.from('users').select('theme').eq('id', user.id).maybeSingle()
        if (!error && data?.theme) {
          setThemeState(data.theme)
          localStorage.setItem('tournadash_theme', data.theme)
        }
      }
    }
    fetchUserTheme()
  }, [])

  useEffect(() => {
    // Apply theme to body
    // Remove all classes that start with 'theme-'
    const classes = document.body.className.split(' ').filter(c => !c.startsWith('theme-'))
    if (theme !== 'default') {
      classes.push(`theme-${theme}`)
    }
    document.body.className = classes.join(' ').trim()
  }, [theme])

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('tournadash_theme', newTheme)
  }

  const saveTheme = async (newTheme) => {
    setTheme(newTheme)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ theme: newTheme }).eq('id', user.id)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, saveTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
