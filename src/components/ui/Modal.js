import { useEffect } from 'react'
import './Modal.css'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md', // sm, md, lg
  id,
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('td-modal-overlay')) {
      onClose()
    }
  }

  return (
    <div className="td-modal-overlay" onClick={handleOverlayClick} id={id}>
      <div className={`td-modal td-modal-${size}`} role="dialog" aria-modal="true">
        <div className="td-modal-header">
          {title && <h2 className="td-modal-title">{title}</h2>}
          <button className="td-modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className="td-modal-body">{children}</div>
        {footer && <div className="td-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
