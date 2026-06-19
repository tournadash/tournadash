import './Button.css'

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, danger, ghost
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  className = '',
  id,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
      id={id}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" />
      ) : null}
      <span className="btn-content">{children}</span>
    </button>
  )
}
