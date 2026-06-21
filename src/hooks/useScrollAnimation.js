import { useEffect } from 'react'

export default function useScrollAnimation(selector = '.animate-on-scroll', dependencies = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px', // triggers slightly before fully in view
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
    
    // Check elements immediately and observe
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect()
      // If already within viewport, show immediately
      if (rect.top >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight)) {
        el.classList.add('visible')
      } else {
        observer.observe(el)
      }
    })

    return () => {
      elements.forEach((el) => observer.unobserve(el))
    }
  }, dependencies)
}
