export default function Badge({
  children,
  variant = 'neutral', // primary, success, danger, warning, info, neutral
  className = '',
  id,
  ...props
}) {
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'var(--font-heading)',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    width: 'fit-content',
    whiteSpace: 'nowrap',
  }

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary-subtle)',
      color: 'var(--color-primary)',
      border: '1px solid rgba(88, 101, 242, 0.2)',
    },
    success: {
      backgroundColor: 'var(--color-success-subtle)',
      color: 'var(--color-success)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
    },
    danger: {
      backgroundColor: 'var(--color-danger-subtle)',
      color: 'var(--color-danger)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-subtle)',
      color: 'var(--color-warning)',
      border: '1px solid rgba(245, 158, 11, 0.2)',
    },
    info: {
      backgroundColor: 'var(--color-info-subtle)',
      color: 'var(--color-info)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
    },
    neutral: {
      backgroundColor: 'var(--color-bg-subtle)',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border)',
    },
  }

  const mergedStyles = { ...styles, ...variants[variant] }

  return (
    <span style={mergedStyles} className={className} id={id} {...props}>
      {children}
    </span>
  )
}
