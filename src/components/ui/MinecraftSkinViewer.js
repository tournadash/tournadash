'use client'

import { useEffect, useRef, useState } from 'react'

export default function MinecraftSkinViewer({ skinUrl, width = 160, height = 240 }) {
  const canvasRef = useRef(null)
  const viewerRef = useRef(null)
  const [isWalking, setIsWalking] = useState(false)
  const [isRotating, setIsRotating] = useState(false)

  // Use standard Steve skin as fallback
  const fallbackSkin = 'https://crafatar.com/skins/85720e6a-72ef-401d-85d7-b08bc8c4146a'
  const activeSkin = skinUrl || fallbackSkin

  useEffect(() => {
    let active = true
    let viewerInstance = null

    // Load skinview3d client-side dynamically to prevent SSR errors
    import('skinview3d').then((skinview3d) => {
      if (!active || !canvasRef.current) return

      // Clean up previous viewer
      if (viewerRef.current) {
        viewerRef.current.dispose()
      }

      try {
        viewerInstance = new skinview3d.SkinViewer({
          canvas: canvasRef.current,
          width: width,
          height: height,
          skin: activeSkin,
        })

        // Enable orbit controls
        viewerInstance.controls.enableRotate = true
        viewerInstance.controls.enableZoom = false
        viewerInstance.controls.enablePan = false

        // Set up initial camera angles (face slightly angled down)
        viewerInstance.camera.position.set(0, 10, 45)
        viewerInstance.controls.update()

        // Set animations
        const walk = viewerInstance.animations.add(skinview3d.WalkingAnimation)
        walk.paused = !isWalking

        viewerInstance.autoRotate = isRotating
        viewerInstance.autoRotateSpeed = 2.0

        viewerRef.current = viewerInstance
      } catch (err) {
        console.error('Error initializing skinview3d:', err)
      }
    })

    return () => {
      active = false
      if (viewerInstance) {
        viewerInstance.dispose()
      }
    }
  }, [activeSkin, width, height])

  // Track state changes and apply to skinview3d without recreating viewer
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.autoRotate = isRotating
    }
  }, [isRotating])

  useEffect(() => {
    if (viewerRef.current) {
      const walk = viewerRef.current.animations.get('walk')
      if (walk) {
        walk.paused = !isWalking
      } else {
        // Fallback: toggling default animation list
        viewerRef.current.animations.animations.forEach(anim => {
          anim.paused = !isWalking
        })
      }
    }
  }, [isWalking])

  const handleReset = () => {
    if (viewerRef.current) {
      viewerRef.current.camera.position.set(0, 10, 45)
      viewerRef.current.controls.target.set(0, 0, 0)
      viewerRef.current.controls.update()
      setIsRotating(false)
    }
  }

  const handleRefresh = () => {
    if (viewerRef.current) {
      viewerRef.current.loadSkin(activeSkin)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3" style={{ maxWidth: `${width}px` }}>
      <div 
        style={{ 
          border: '1px solid var(--color-border)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '8px', 
          backgroundColor: 'var(--color-bg-input)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          display: 'inline-flex',
          cursor: 'grab'
        }}
      >
        <canvas ref={canvasRef} width={width} height={height} style={{ outline: 'none' }} />
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center" style={{ width: '100%' }}>
        <button 
          type="button" 
          onClick={handleRefresh}
          className="btn btn-ghost btn-xs"
          style={{ fontSize: '10px', padding: '2px 6px' }}
          title="Reload texture"
        >
          🔄 Reload
        </button>
        <button 
          type="button" 
          onClick={handleReset}
          className="btn btn-ghost btn-xs"
          style={{ fontSize: '10px', padding: '2px 6px' }}
          title="Reset rotation & zoom"
        >
          🧹 Reset
        </button>
        <button 
          type="button" 
          onClick={() => setIsWalking(!isWalking)}
          className={`btn btn-xs ${isWalking ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '10px', padding: '2px 6px' }}
        >
          {isWalking ? '⏸️ Stop' : '🏃 Walk'}
        </button>
        <button 
          type="button" 
          onClick={() => setIsRotating(!isRotating)}
          className={`btn btn-xs ${isRotating ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '10px', padding: '2px 6px' }}
        >
          🔄 {isRotating ? 'Spinning' : 'Spin'}
        </button>
      </div>
    </div>
  )
}
