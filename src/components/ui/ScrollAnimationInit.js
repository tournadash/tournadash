'use client'

import { useEffect } from 'react'

export default function ScrollAnimationInit({ selector = '.animate-on-scroll' }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px', // slightly offset trigger to feel natural
      threshold: 0.05,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          // Stop observing to make it a one-time animation
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    const elements = document.querySelectorAll(selector)
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect()
      // If already within viewport, reveal immediately
      if (rect.top >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight)) {
        el.classList.add('visible')
      } else {
        observer.observe(el)
      }
    })

    return () => {
      elements.forEach((el) => observer.unobserve(el))
    }
  }, [selector])

  return null
}
