export default function Avatar({
  src,
  alt = 'Avatar',
  size = 'md', // sm, md, lg, xl
  fallback = '👤',
  className = '',
  id,
}) {
  const sizes = {
    sm: '32px',
    md: '40px',
    lg: '56px',
    xl: '80px',
  }

  const currentSize = sizes[size] || sizes.md

  const containerStyles = {
    width: currentSize,
    height: currentSize,
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg-subtle)',
    border: '1px solid var(--color-border)',
    flexShrink: 0,
    position: 'relative',
    userSelect: 'none',
  }

  const imgStyles = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }

  const fallbackStyles = {
    fontSize: size === 'sm' ? '12px' : size === 'md' ? '16px' : size === 'lg' ? '24px' : '36px',
    color: 'var(--color-text-secondary)',
    fontWeight: '600',
    fontFamily: 'var(--font-heading)',
  }

  return (
    <div style={containerStyles} className={className} id={id}>
      {src ? (
        <img src={src} alt={alt} style={imgStyles} onError={(e) => { e.target.style.display = 'none' }} />
      ) : (
        <span style={fallbackStyles}>{fallback}</span>
      )}
    </div>
  )
}
